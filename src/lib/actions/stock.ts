'use server';

import { createServiceClient } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';

const supabase = createServiceClient();

export interface ReserveStockResult {
  success: boolean;
  reservations?: Array<{
    id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
  }>;
  error?: string;
}

export async function reserveStockForQuote(quoteId: string): Promise<ReserveStockResult> {
  try {
    // Get quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          id,
          product_id,
          variant_id,
          quantity,
          configuration
        )
      `)
      .eq('id', quoteId)
      .single();
    
    if (quoteError || !quote) {
      return { success: false, error: 'Quote not found' };
    }
    
    if (quote.status !== 'draft' && quote.status !== 'sent') {
      return { success: false, error: 'Quote must be in draft or sent status' };
    }
    
    const reservations: Array<{ id: string; product_id: string; variant_id: string | null; quantity: number }> = [];
    const validUntil = new Date(quote.valid_until);
    const reservationExpires = new Date(validUntil);
    reservationExpires.setHours(reservationExpires.getHours() + 24); // 24h buffer
    
    // Use transaction-like approach with SELECT FOR UPDATE
    for (const item of quote.quote_items) {
      // Lock the product row
      const { data: product, error: lockError } = await supabase
        .from('products')
        .select('id, stock_available, stock_reserved')
        .eq('id', item.product_id)
        .single();
      
      if (lockError || !product) {
        // Release any reservations already created in this loop
        await releaseReservations(quoteId, 'lock_failed');
        return { success: false, error: `Failed to lock product ${item.product_id}` };
      }
      
      const available = product.stock_available;
      if (available < item.quantity) {
        await releaseReservations(quoteId, 'insufficient_stock');
        return { 
          success: false, 
          error: `Insufficient stock for product ${item.product_id}: ${available} available, ${item.quantity} requested` 
        };
      }
      
      // Create reservation
      const { data: reservation, error: resError } = await supabase
        .from('stock_reservations')
        .insert({
          quote_id: quoteId,
          quote_item_id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          expires_at: reservationExpires.toISOString(),
        })
        .select()
        .single();
      
      if (resError || !reservation) {
        await releaseReservations(quoteId, 'reservation_failed');
        return { success: false, error: 'Failed to create reservation' };
      }
      
      // Update product stock
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stock_available: product.stock_available - item.quantity,
          stock_reserved: product.stock_reserved + item.quantity,
        })
        .eq('id', item.product_id);
      
      if (stockError) {
        await releaseReservations(quoteId, 'stock_update_failed');
        return { success: false, error: 'Failed to update stock' };
      }
      
      // Update quote_item with reservation_id
      await supabase
        .from('quote_items')
        .update({ reservation_id: reservation.id })
        .eq('id', item.id);
      
      reservations.push({
        id: reservation.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
    }
    
    return { success: true, reservations };
  } catch (error) {
    console.error('Error reserving stock:', error);
    await releaseReservations(quoteId, 'exception');
    return { success: false, error: 'Failed to reserve stock' };
  }
}

async function releaseReservations(quoteId: string, reason: string): Promise<void> {
  try {
    // Get all active reservations for this quote
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'active');
    
    if (!reservations || reservations.length === 0) return;
    
    for (const res of reservations) {
      // Update reservation status
      await supabase
        .from('stock_reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_reason: reason,
        })
        .eq('id', res.id);
      
      // Return stock to available
      await supabase.rpc('increment_product_stock', {
        p_product_id: res.product_id,
        p_variant_id: res.variant_id,
        p_available_delta: res.quantity,
        p_reserved_delta: -res.quantity,
      });
    }
  } catch (error) {
    console.error('Error releasing reservations:', error);
  }
}

export async function releaseQuoteReservations(
  quoteId: string,
  reason: 'quote_expired' | 'quote_rejected' | 'manual' = 'manual'
): Promise<{ success: boolean; released?: number; error?: string }> {
  try {
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'active');
    
    if (!reservations || reservations.length === 0) {
      return { success: true, released: 0 };
    }
    
    let releasedCount = 0;
    
    for (const res of reservations) {
      // Log release (idempotent)
      await supabase
        .from('stock_reservation_release_log')
        .upsert({
          reservation_id: res.id,
          released_by: reason,
        }, { onConflict: 'reservation_id' });
      
      // Only proceed if log insert succeeded (idempotency)
      const { data: logCheck } = await supabase
        .from('stock_reservation_release_log')
        .select('reservation_id')
        .eq('reservation_id', res.id)
        .single();
      
      if (!logCheck) continue; // Already processed
      
      // Update reservation
      await supabase
        .from('stock_reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_reason: reason,
        })
        .eq('id', res.id);
      
      // Return stock
      await supabase.rpc('increment_product_stock', {
        p_product_id: res.product_id,
        p_variant_id: res.variant_id,
        p_available_delta: res.quantity,
        p_reserved_delta: -res.quantity,
      });
      
      releasedCount++;
    }
    
    // Update quote status if still active
    await supabase
      .from('quotes')
      .update({ status: 'expired' })
      .eq('id', quoteId)
      .in('status', ['sent', 'viewed', 'negotiating']);
    
    revalidatePath(`/admin/quotes`);
    
    return { success: true, released: releasedCount };
  } catch (error) {
    console.error('Error releasing reservations:', error);
    return { success: false, error: 'Failed to release reservations' };
  }
}

export async function convertReservationsToOrder(quoteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'active');
    
    if (!reservations || reservations.length === 0) {
      return { success: true };
    }
    
    for (const res of reservations) {
      await supabase
        .from('stock_reservations')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', res.id);
      
      // Remove from reserved, keep available as is (already decremented on reservation)
      // The stock is now committed to the order
      await supabase.rpc('increment_product_stock', {
        p_product_id: res.product_id,
        p_variant_id: res.variant_id,
        p_available_delta: 0,
        p_reserved_delta: -res.quantity,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error converting reservations:', error);
    return { success: false, error: 'Failed to convert reservations' };
  }
}

// Cron job handler for expired reservations
export async function releaseExpiredReservations(): Promise<{ success: boolean; released: number; error?: string }> {
  try {
    const { data: expired } = await supabase
      .from('stock_reservations')
      .select('id, product_id, variant_id, quantity, quote_id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());
    
    if (!expired || expired.length === 0) {
      return { success: true, released: 0 };
    }
    
    let releasedCount = 0;
    
    for (const res of expired) {
      // Idempotency check
      const { data: logCheck } = await supabase
        .from('stock_reservation_release_log')
        .select('reservation_id')
        .eq('reservation_id', res.id)
        .single();
      
      if (logCheck) continue;
      
      // Log release
      await supabase
        .from('stock_reservation_release_log')
        .upsert({
          reservation_id: res.id,
          released_by: 'cron',
        }, { onConflict: 'reservation_id' });
      
      // Check if log was inserted (idempotency)
      const { data: logInserted } = await supabase
        .from('stock_reservation_release_log')
        .select('reservation_id')
        .eq('reservation_id', res.id)
        .single();
      
      if (!logInserted) continue;
      
      // Update reservation
      await supabase
        .from('stock_reservations')
        .update({
          status: 'expired',
          released_at: new Date().toISOString(),
          released_reason: 'quote_expired',
        })
        .eq('id', res.id);
      
      // Return stock
      await supabase.rpc('increment_product_stock', {
        p_product_id: res.product_id,
        p_variant_id: res.variant_id,
        p_available_delta: res.quantity,
        p_reserved_delta: -res.quantity,
      });
      
      // Update quote status
      await supabase
        .from('quotes')
        .update({ status: 'expired' })
        .eq('id', res.quote_id)
        .in('status', ['sent', 'viewed', 'negotiating']);
      
      releasedCount++;
    }
    
    return { success: true, released: releasedCount };
  } catch (error) {
    console.error('Error releasing expired reservations:', error);
    return { success: false, released: 0, error: 'Failed to release expired reservations' };
  }
}

// Stock availability check for inquiry builder
export async function checkStockAvailability(
  items: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<{ success: boolean; available: boolean; details: Array<{ productId: string; variantId?: string; available: number; requested: number }> }> {
  try {
    const details = [];
    let allAvailable = true;
    
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_available')
        .eq('id', item.productId)
        .single();
      
      let available = product?.stock_available || 0;
      
      if (item.variantId) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('stock_available')
          .eq('id', item.variantId)
          .single();
        available = variant?.stock_available || 0;
      }
      
      if (available < item.quantity) {
        allAvailable = false;
      }
      
      details.push({
        productId: item.productId,
        variantId: item.variantId,
        available,
        requested: item.quantity,
      });
    }
    
    return { success: true, available: allAvailable, details };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return { success: false, available: false, details: [] };
  }
}