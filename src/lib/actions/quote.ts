'use server';

import { createServiceClient } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { calculateQuotePrice, type PriceCalculationInput, type PriceCalculationOutput, type Configuration } from '@/lib/pricing/engine';

let client: ReturnType<typeof createServiceClient> | null = null;

function getSupabase() {
  if (!client) {
    client = createServiceClient();
  }
  return client;
}

function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `Q-${year}-${random}-v1`;
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}-${random}`;
}

export interface GenerateQuoteResult {
  success: boolean;
  quote?: {
    id: string;
    quote_number: string;
    version: number;
    status: string;
    total_usd: number;
    valid_until: string;
  };
  error?: string;
}

export async function generateQuote(
  inquiryId: string,
  createdBy: string,
  options?: {
    discount_percent?: number;
    payment_terms_days?: number;
    deposit_percent?: number;
    lead_time_weeks?: number;
    notes?: string;
  }
): Promise<GenerateQuoteResult> {
  try {
    const { data: inquiry, error: inquiryError } = await getSupabase()
      .from('inquiries')
      .select(`
        *,
        inquiry_items (
          id,
          product_id,
          variant_id,
          quantity,
          configuration,
          unit_price_usd,
          line_total_usd,
          notes,
          sort_order
        ),
        customer:customer_id (
          id,
          email,
          company_name,
          contact_name,
          tier:customer_tiers (
            name,
            discount_percent,
            payment_terms_days,
            deposit_percent
          )
        )
      `)
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return { success: false, error: 'Inquiry not found' };
    }

    if (inquiry.status !== 'submitted' && inquiry.status !== 'qualified') {
      return { success: false, error: 'Inquiry must be submitted or qualified to generate quote' };
    }

    if (!inquiry.inquiry_items || inquiry.inquiry_items.length === 0) {
      return { success: false, error: 'Cannot generate quote for empty inquiry' };
    }

    // Check for existing draft quote
    const { data: existingDraft } = await getSupabase()
      .from('quotes')
      .select('id')
      .eq('inquiry_id', inquiryId)
      .eq('status', 'draft')
      .single();

    // Get tier info
    const tierName = inquiry.customer?.tier?.name || 'retail';
    const tierDiscount = inquiry.customer?.tier?.discount_percent || 0;
    const tierPaymentTerms = inquiry.customer?.tier?.payment_terms_days || 30;
    const tierDepositPercent = inquiry.customer?.tier?.deposit_percent || 50;

    // Prepare pricing input
    const pricingInput: PriceCalculationInput = {
      items: inquiry.inquiry_items.map((item: { product_id: string; variant_id: string | null; quantity: number; configuration: Record<string, unknown> }) => ({
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        quantity: item.quantity,
        configuration: item.configuration as Configuration,
      })),
      customerTier: tierName as 'retail' | 'trade' | 'project' | 'vip',
      shippingAddress: {
        country: 'MY',
        state: (inquiry.shipping_address as Record<string, unknown>)?.state as string || 'KL',
        postal_code: (inquiry.shipping_address as Record<string, unknown>)?.postal_code as string || '',
      },
      discountCode: options?.discount_percent ? 'MANUAL' : undefined,
    };

    // Calculate pricing
    const pricingResult = await calculateQuotePrice(pricingInput);

    // Apply manual discount if provided
    let discountUsd = 0;
    if (options?.discount_percent) {
      discountUsd = pricingResult.subtotal * (options.discount_percent / 100);
    } else if (tierDiscount > 0) {
      discountUsd = pricingResult.subtotal * (tierDiscount / 100);
    }

    const subtotal = pricingResult.subtotal - discountUsd;
    const taxUsd = pricingResult.tax;
    const shippingUsd = pricingResult.shipping;
    const total = subtotal + taxUsd + shippingUsd;

    // Valid until: 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Get existing quote version or start at 1
    let version = 1;
    const { data: existingQuotes } = await getSupabase()
      .from('quotes')
      .select('version')
      .eq('inquiry_id', inquiryId)
      .order('version', { ascending: false })
      .limit(1);

    if (existingQuotes && existingQuotes.length > 0) {
      version = existingQuotes[0].version + 1;
    }

    const quoteNumber = `Q-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-v${version}`;

    // Create quote
    const { data: quote, error: quoteError } = await getSupabase()
      .from('quotes')
      .insert({
        inquiry_id: inquiryId,
        version,
        status: 'draft',
        quote_number: quoteNumber,
        valid_until: validUntil.toISOString(),
        subtotal_usd: subtotal,
        discount_usd: discountUsd,
        tax_usd: taxUsd,
        shipping_usd: shippingUsd,
        total_usd: total,
        currency: 'MYR',
        base_currency: 'MYR',
        payment_terms_days: options?.payment_terms_days || tierPaymentTerms,
        deposit_percent: options?.deposit_percent || tierDepositPercent,
        lead_time_weeks: options?.lead_time_weeks || pricingResult.leadTimeWeeks,
        created_by: createdBy,
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    // Reserve stock for quote items
    for (const item of inquiry.inquiry_items) {
      const pricingItem = pricingResult.lineItems.find(p => p.productId === item.product_id && p.variantId === item.variant_id);
      if (!pricingItem) continue;

      // Check available stock
      const { data: stock } = await getSupabase()
        .from('products')
        .select('stock_available, stock_reserved')
        .eq('id', item.product_id)
        .single();

      if (stock && stock.stock_available < item.quantity) {
        // Can't reserve - but we'll still create the quote with a warning
        console.warn(`Insufficient stock for product ${item.product_id}: ${stock.stock_available} available, ${item.quantity} requested`);
      }

      // Create stock reservation (valid_until + 24h buffer)
      const reservationExpires = new Date(validUntil);
      reservationExpires.setHours(reservationExpires.getHours() + 24);

      const { data: reservation } = await getSupabase()
        .from('stock_reservations')
        .insert({
          quote_id: quote.id,
          quote_item_id: null, // Will be updated after quote_items created
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          expires_at: reservationExpires.toISOString(),
        })
        .select()
        .single();

      // Decrement available, increment reserved
      if (stock) {
        await getSupabase()
          .from('products')
          .update({
            stock_available: stock.stock_available - item.quantity,
            stock_reserved: stock.stock_reserved + item.quantity,
          })
          .eq('id', item.product_id);
      }
    }

    // Create quote items
    for (let i = 0; i < inquiry.inquiry_items.length; i++) {
      const item = inquiry.inquiry_items[i];
      const pricingItem = pricingResult.lineItems.find(p => p.productId === item.product_id && p.variantId === item.variant_id);

      const unitPrice = pricingItem?.unitPrice || item.unit_price_usd || 0;
      const lineTotal = unitPrice * item.quantity;

      const { data: quoteItem } = await getSupabase()
        .from('quote_items')
        .insert({
          quote_id: quote.id,
          inquiry_item_id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          configuration: item.configuration,
          unit_price_usd: unitPrice,
          line_total_usd: lineTotal,
          sort_order: item.sort_order,
        })
        .select()
        .single();

      // Update reservation with quote_item_id
      if (quoteItem) {
        await getSupabase()
          .from('stock_reservations')
          .update({ quote_item_id: quoteItem.id })
          .eq('quote_id', quote.id)
          .eq('product_id', item.product_id)
          .eq('variant_id', item.variant_id || null)
          .is('quote_item_id', null);
      }
    }

    // Create quote version snapshot
    await getSupabase()
      .from('quote_versions')
      .insert({
        quote_id: quote.id,
        version,
        snapshot: {
          items: pricingResult.lineItems,
          pricing: {
            subtotal: pricingResult.subtotal,
            discount: discountUsd,
            tax: taxUsd,
            shipping: shippingUsd,
            total,
          },
          terms: {
            payment_terms_days: options?.payment_terms_days || tierPaymentTerms,
            deposit_percent: options?.deposit_percent || tierDepositPercent,
            lead_time_weeks: options?.lead_time_weeks || pricingResult.leadTimeWeeks,
          },
        },
        change_summary: `v${version}: Initial quote generated`,
        created_by: createdBy,
      });

    // Update inquiry status
    await getSupabase()
      .from('inquiries')
      .update({ status: 'quoted', quoted_at: new Date().toISOString() })
      .eq('id', inquiryId);

    revalidatePath(`/admin/inquiries/${inquiryId}`);
    revalidatePath(`/admin/quotes/${quote.id}`);

    return { success: true, quote: { ...quote, total_usd: total } };
  } catch (error) {
    console.error('Error generating quote:', error);
    return { success: false, error: 'Failed to generate quote' };
  }
}

export interface SendQuoteResult {
  success: boolean;
  error?: string;
}

export async function sendQuote(quoteId: string, createdBy: string): Promise<SendQuoteResult> {
  try {
    const { data: quote } = await getSupabase()
      .from('quotes')
      .select('*, inquiry:inquiry_id (customer:customer_id (email, contact_name, company_name))')
      .eq('id', quoteId)
      .single();

    if (!quote || quote.status !== 'draft') {
      return { success: false, error: 'Quote not found or not in draft status' };
    }

    // Generate PDF (placeholder - actual implementation in lib/pdf)
    const pdfUrl = await generateQuotePdf(quote.id);

    // Update quote status
    const { error } = await getSupabase()
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (error) throw error;

    // Create quote version for sent state
    const { data: versions } = await getSupabase()
      .from('quote_versions')
      .select('version')
      .eq('quote_id', quoteId)
      .order('version', { ascending: false })
      .limit(1);

    const currentVersion = versions?.[0]?.version || 1;

    await getSupabase()
      .from('quote_versions')
      .insert({
        quote_id: quoteId,
        version: currentVersion,
        snapshot: { action: 'sent', sent_at: new Date().toISOString() },
        change_summary: `v${currentVersion}: Quote sent to customer`,
        created_by: createdBy,
      });

    // TODO: Send email via lib/email service
    // await sendQuoteEmail(quote.inquiry.customer.email, quote.quote_number, pdfUrl);

    revalidatePath(`/admin/quotes/${quoteId}`);

    return { success: true };
  } catch (error) {
    console.error('Error sending quote:', error);
    return { success: false, error: 'Failed to send quote' };
  }
}

export async function reviseQuote(
  quoteId: string,
  createdBy: string,
  options: {
    discount_percent?: number;
    payment_terms_days?: number;
    deposit_percent?: number;
    lead_time_weeks?: number;
    items?: { quote_item_id: string; quantity?: number; unit_price_usd?: number; configuration?: Record<string, unknown> }[];
    change_summary: string;
  }
): Promise<GenerateQuoteResult> {
  try {
    const { data: quote } = await getSupabase()
      .from('quotes')
      .select('*, inquiry:inquiry_id (id, inquiry_items (*))')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.status === 'accepted' || quote.status === 'converted') {
      return { success: false, error: 'Cannot revise accepted or converted quote' };
    }

    // Create new version
    const newVersion = quote.version + 1;
    const newQuoteNumber = quote.quote_number.replace(/-v\d+$/, `-v${newVersion}`);

    // Apply revisions
    let subtotal = quote.subtotal_usd;
    let discountUsd = quote.discount_usd;

    if (options.discount_percent !== undefined) {
      discountUsd = subtotal * (options.discount_percent / 100);
    }

    // Update line items if provided
    if (options.items) {
      for (const item of options.items) {
        if (item.quantity !== undefined) {
          // Update quantity - would need to check stock
        }
        if (item.unit_price_usd !== undefined) {
          // Update unit price
        }
        if (item.configuration) {
          // Update configuration
        }
      }
    }

    // Recalculate totals
    const newTotal = subtotal - discountUsd + quote.tax_usd + quote.shipping_usd;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create new quote record (immutable history)
    const { data: newQuote, error } = await getSupabase()
      .from('quotes')
      .insert({
        inquiry_id: quote.inquiry_id,
        version: newVersion,
        status: 'draft',
        quote_number: newQuoteNumber,
        valid_until: validUntil.toISOString(),
        subtotal_usd: subtotal,
        discount_usd: discountUsd,
        tax_usd: quote.tax_usd,
        shipping_usd: quote.shipping_usd,
        total_usd: newTotal,
        currency: quote.currency,
        base_currency: quote.base_currency,
        exchange_rate: quote.exchange_rate,
        exchange_rate_date: quote.exchange_rate_date,
        tax_jurisdiction: quote.tax_jurisdiction,
        tax_rate: quote.tax_rate,
        tax_calculation_method: quote.tax_calculation_method,
        payment_terms_days: options.payment_terms_days || quote.payment_terms_days,
        deposit_percent: options.deposit_percent || quote.deposit_percent,
        lead_time_weeks: options.lead_time_weeks || quote.lead_time_weeks,
        parent_quote_id: quote.id,
        change_summary: options.change_summary,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Copy quote items
    const { data: oldItems } = await getSupabase()
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId);

    if (oldItems) {
      for (const item of oldItems) {
        // Apply item-level changes if any
        const itemChange = options.items?.find(c => c.quote_item_id === item.id);
        const newQuantity = itemChange?.quantity || item.quantity;
        const newUnitPrice = itemChange?.unit_price_usd || item.unit_price_usd;
        const newConfig = itemChange?.configuration || item.configuration;
        const newLineTotal = newUnitPrice * newQuantity;

        await getSupabase()
          .from('quote_items')
          .insert({
            quote_id: newQuote.id,
            inquiry_item_id: item.inquiry_item_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: newQuantity,
            configuration: newConfig,
            unit_price_usd: newUnitPrice,
            line_total_usd: newLineTotal,
            sort_order: item.sort_order,
          });
      }
    }

    // Create version snapshot
    await getSupabase()
      .from('quote_versions')
      .insert({
        quote_id: newQuote.id,
        version: newVersion,
        snapshot: { action: 'revised', changes: options },
        change_summary: options.change_summary,
        created_by: createdBy,
      });

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath(`/admin/quotes/${newQuote.id}`);

    return { success: true, quote: { ...newQuote, total_usd: newTotal } };
  } catch (error) {
    console.error('Error revising quote:', error);
    return { success: false, error: 'Failed to revise quote' };
  }
}

export async function acceptQuote(quoteId: string, customerId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Use the atomic database function
    const { data: orderId, error } = await getSupabase().rpc('accept_quote', {
      p_quote_id: quoteId,
      p_customer_id: customerId,
    });

    if (error) {
      if (error.message.includes('expired')) {
        return { success: false, error: 'Quote has expired' };
      }
      if (error.message.includes('not in acceptable state')) {
        return { success: false, error: 'Quote cannot be accepted in current state' };
      }
      if (error.message.includes('reservations')) {
        return { success: false, error: 'Some items are no longer available' };
      }
      return { success: false, error: error.message };
    }

    if (!orderId) {
      return { success: false, error: 'Order creation failed' };
    }

    revalidatePath(`/customer/quotes/${quoteId}`);
    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath(`/admin/orders/${orderId}`);

    // TODO: Send acceptance email
    // TODO: Trigger deposit invoice

    return { success: true, orderId };
  } catch (error) {
    console.error('Error accepting quote:', error);
    return { success: false, error: 'Failed to accept quote' };
  }
}

export async function rejectQuote(quoteId: string, customerId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: quote } = await getSupabase()
      .from('quotes')
      .select('inquiry_id, status, version')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'sent' && quote.status !== 'viewed' && quote.status !== 'negotiating') {
      return { success: false, error: 'Quote cannot be rejected in current state' };
    }

    // Release stock reservations
    const { data: reservations } = await getSupabase()
      .from('stock_reservations')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'active');

    if (reservations) {
      for (const res of reservations) {
        await getSupabase().rpc('release_reservation', { p_reservation_id: res.id, p_reason: 'quote_rejected' });
      }
    }

    // Update quote status
    await getSupabase()
      .from('quotes')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_reason: reason,
      })
      .eq('id', quoteId);

    // Update inquiry status
    await getSupabase()
      .from('inquiries')
      .update({ status: 'submitted' }) // Back to submitted for revision
      .eq('id', quote.inquiry_id);

    // Create version snapshot
    await getSupabase()
      .from('quote_versions')
      .insert({
        quote_id: quoteId,
        version: quote.version,
        snapshot: { action: 'rejected', reason },
        change_summary: `Rejected: ${reason}`,
        created_by: customerId,
      });

    revalidatePath(`/customer/quotes/${quoteId}`);
    revalidatePath(`/admin/quotes/${quoteId}`);

    return { success: true };
  } catch (error) {
    console.error('Error rejecting quote:', error);
    return { success: false, error: 'Failed to reject quote' };
  }
}

// PDF generation placeholder
async function generateQuotePdf(quoteId: string): Promise<string> {
  // TODO: Implement with lib/pdf/quote-pdf.ts
  return `/api/v1/quotes/${quoteId}/pdf`;
}