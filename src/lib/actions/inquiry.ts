'use server';

import { createServiceClient } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

let client: ReturnType<typeof createServiceClient> | null = null;

function getSupabase() {
  if (!client) {
    client = createServiceClient();
  }
  return client;
}

const ANON_SESSION_COOKIE = 'lotten_anon_session';

async function getOrCreateAnonSession(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(ANON_SESSION_COOKIE)?.value;
  
  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(ANON_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }
  
  return sessionId;
}

export interface CreateInquiryResult {
  success: boolean;
  inquiry?: {
    id: string;
    session_id?: string;
    status: string;
    created_at: string;
  };
  error?: string;
}

export async function createInquiry(customerId?: string): Promise<CreateInquiryResult> {
  try {
    const sessionId = await getOrCreateAnonSession();
    
    // Check if there's already a draft inquiry for this session
    const { data: existing } = await getSupabase()
      .from('inquiries')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .eq('status', 'draft')
      .single();
    
    if (existing) {
      return { success: true, inquiry: { ...existing, status: 'draft', created_at: '' } };
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    const { data, error } = await getSupabase()
          .from('inquiries')
          .insert({
            session_id: sessionId,
            customer_id: customerId || null,
            status: 'draft',
            source_channel: 'web',
            expires_at: expiresAt.toISOString(),
          })
          .select('id, session_id, status, created_at')
          .single();

        if (error) throw error;

        return { success: true, inquiry: { ...data, status: 'draft', created_at: data.created_at } };
      } catch (error) {
    console.error('Error creating inquiry:', error);
    return { success: false, error: 'Failed to create inquiry' };
  }
}

export interface AddInquiryItemResult {
  success: boolean;
  item?: {
    id: string;
    inquiry_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    configuration: Record<string, unknown>;
    unit_price_usd: number | null;
    line_total_usd: number | null;
  };
  error?: string;
}

export async function addInquiryItem(
  inquiryId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
  configuration: Record<string, unknown>
): Promise<AddInquiryItemResult> {
  try {
    // Verify inquiry exists and is in draft status
    const { data: inquiry, error: inquiryError } = await getSupabase()
      .from('inquiries')
      .select('status')
      .eq('id', inquiryId)
      .single();
    
    if (inquiryError || !inquiry) {
      return { success: false, error: 'Inquiry not found' };
    }
    
    if (inquiry.status !== 'draft') {
      return { success: false, error: 'Cannot add items to non-draft inquiry' };
    }
    
    // Get product base price
    const { data: product, error: productError } = await getSupabase()
      .from('products')
      .select('price_usd, configuration_schema')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return { success: false, error: 'Product not found' };
    }
    
    // Validate configuration against product schema (basic check)
    if (product.configuration_schema && typeof product.configuration_schema === 'object') {
      const schema = product.configuration_schema as Record<string, unknown>;
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(field in configuration)) {
            return { success: false, error: `Missing required configuration: ${field}` };
          }
        }
      }
    }
    
    // Get variant price if applicable
    let basePrice = product.price_usd;
    if (variantId) {
      const { data: variant } = await getSupabase()
        .from('product_variants')
        .select('price_usd')
        .eq('id', variantId)
        .single();
      if (variant) basePrice = variant.price_usd;
    }
    
    // Calculate estimated price (real-time pricing)
    // This is a simplified version - full pricing engine will be called at quote generation
    const unitPrice = basePrice; // Configuration modifiers applied later
    const lineTotal = unitPrice * quantity;
    
    // Get max sort_order
    const { data: maxSort } = await getSupabase()
      .from('inquiry_items')
      .select('sort_order')
      .eq('inquiry_id', inquiryId)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextSort = (maxSort?.[0]?.sort_order ?? -1) + 1;
    
    const { data, error } = await getSupabase()
      .from('inquiry_items')
      .insert({
        inquiry_id: inquiryId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        configuration,
        unit_price_usd: unitPrice,
        line_total_usd: lineTotal,
        sort_order: nextSort,
      })
      .select('*')
      .single();
    
    if (error) throw error;
    
    revalidatePath(`/inquiries/${inquiryId}`);
    
    return { success: true, item: data };
  } catch (error) {
    console.error('Error adding inquiry item:', error);
    return { success: false, error: 'Failed to add item to inquiry' };
  }
}

export interface UpdateInquiryItemResult {
  success: boolean;
  error?: string;
}

export async function updateInquiryItem(
  itemId: string,
  updates: { quantity?: number; configuration?: Record<string, unknown>; notes?: string }
): Promise<UpdateInquiryItemResult> {
  try {
    const { data: item, error: itemError } = await getSupabase()
      .from('inquiry_items')
      .select('inquiry_id, quantity, unit_price_usd, configuration')
      .eq('id', itemId)
      .single();
    
    if (itemError || !item) {
      return { success: false, error: 'Item not found' };
    }
    
    // Check inquiry is still draft
    const { data: inquiry } = await getSupabase()
      .from('inquiries')
      .select('status')
      .eq('id', item.inquiry_id)
      .single();
    
    if (inquiry?.status !== 'draft') {
      return { success: false, error: 'Cannot modify items in non-draft inquiry' };
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (updates.quantity !== undefined) {
      if (updates.quantity <= 0) {
        return { success: false, error: 'Quantity must be positive' };
      }
      updateData.quantity = updates.quantity;
      updateData.line_total_usd = (item.unit_price_usd || 0) * updates.quantity;
    }
    
    if (updates.configuration) {
      updateData.configuration = updates.configuration;
    }
    
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }
    
    const { error } = await getSupabase()
      .from('inquiry_items')
      .update(updateData)
      .eq('id', itemId);
    
    if (error) throw error;
    
    revalidatePath(`/inquiries/${item.inquiry_id}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating inquiry item:', error);
    return { success: false, error: 'Failed to update item' };
  }
}

export async function removeInquiryItem(itemId: string): Promise<UpdateInquiryItemResult> {
  try {
    const { data: item } = await getSupabase()
      .from('inquiry_items')
      .select('inquiry_id')
      .eq('id', itemId)
      .single();
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    const { error } = await getSupabase()
      .from('inquiry_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
    
    revalidatePath(`/inquiries/${item.inquiry_id}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing inquiry item:', error);
    return { success: false, error: 'Failed to remove item' };
  }
}

export async function submitInquiry(inquiryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: inquiry, error: inquiryError } = await getSupabase()
      .from('inquiries')
      .select('status, customer_id')
      .eq('id', inquiryId)
      .single();
    
    if (inquiryError || !inquiry) {
      return { success: false, error: 'Inquiry not found' };
    }
    
    if (inquiry.status !== 'draft') {
      return { success: false, error: 'Inquiry already submitted' };
    }
    
    // Check has at least one item
    const { count } = await getSupabase()
      .from('inquiry_items')
      .select('*', { count: 'exact', head: true })
      .eq('inquiry_id', inquiryId);
    
    if (!count || count === 0) {
      return { success: false, error: 'Cannot submit empty inquiry' };
    }
    
    const { error } = await getSupabase()
      .from('inquiries')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', inquiryId);
    
    if (error) throw error;
    
    revalidatePath(`/inquiries/${inquiryId}`);
    
    // TODO: Send inquiry confirmation email
    // TODO: Assign sales rep (round-robin or by region)
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    return { success: false, error: 'Failed to submit inquiry' };
  }
}

export async function mergeInquiryOnLogin(sessionId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find anonymous draft inquiry
    const { data: anonInquiry } = await getSupabase()
      .from('inquiries')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'draft')
      .single();
    
    if (!anonInquiry) {
      return { success: true }; // Nothing to merge
    }
    
    // Check if customer already has a draft inquiry
    const { data: customerDraft } = await getSupabase()
      .from('inquiries')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'draft')
      .single();
    
    if (customerDraft) {
      // Merge items from anon into customer draft
      const { data: anonItems } = await getSupabase()
        .from('inquiry_items')
        .select('*')
        .eq('inquiry_id', anonInquiry.id);
      
      if (anonItems && anonItems.length > 0) {
        for (const item of anonItems) {
          // Check for duplicate product/variant in customer draft
          const { data: existing } = await getSupabase()
            .from('inquiry_items')
            .select('id, quantity')
            .eq('inquiry_id', customerDraft.id)
            .eq('product_id', item.product_id)
            .eq('variant_id', item.variant_id)
            .single();
          
          if (existing) {
            // Merge quantities
            await getSupabase()
              .from('inquiry_items')
              .update({ quantity: existing.quantity + item.quantity })
              .eq('id', existing.id);
          } else {
            // Copy item to customer draft
            await getSupabase()
              .from('inquiry_items')
              .insert({
                inquiry_id: customerDraft.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                configuration: item.configuration,
                unit_price_usd: item.unit_price_usd,
                line_total_usd: item.line_total_usd,
                notes: item.notes,
                sort_order: item.sort_order,
              });
          }
        }
      }
      
      // Delete anon inquiry
      await getSupabase().from('inquiries').delete().eq('id', anonInquiry.id);
    } else {
      // Reassign anon inquiry to customer
      await getSupabase()
        .from('inquiries')
        .update({ customer_id: customerId })
        .eq('id', anonInquiry.id);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error merging inquiry on login:', error);
    return { success: false, error: 'Failed to merge inquiry' };
  }
}