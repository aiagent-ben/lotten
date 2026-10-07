import { createServiceClient } from '@/lib/db/client';
import { cookies } from 'next/headers';
import {
  generateQuote,
  sendQuote,
  reviseQuote,
  acceptQuote,
  rejectQuote,
} from '@/lib/actions/quote';
import { checkStockAvailability } from '@/lib/actions/stock';
import { getAuthenticatedCustomer } from '@/lib/auth/user';

function getSupabase() {
  return createServiceClient();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('id');
    const inquiryId = searchParams.get('inquiry_id');
    const status = searchParams.get('status');

    // 1. Authenticate caller
    const authResult = await getAuthenticatedCustomer(request);
    if (!authResult) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { user, customer } = authResult;
    const isAdmin = user.user_metadata?.role === 'admin' || customer.is_active && user.user_metadata?.role === 'admin';
    
    // Get single quote with all details
    if (quoteId) {
      const { data: quote, error } = await getSupabase()
        .from('quotes')
        .select(`
          *,
          quote_items (
            *,
            product:product_id (id, name, slug, price_usd, images:product_images!product_id (url, alt_text, is_primary)),
            variant:variant_id (id, name, price_usd),
            reservation:stock_reservations!reservation_id (id, status, expires_at)
          ),
          inquiry:inquiry_id (
            id,
            session_id,
            customer_id,
            customer:customer_id (id, email, contact_name, company_name),
            inquiry_items (*)
          ),
          quote_versions (version, change_summary, created_at, created_by)
        `)
        .eq('id', quoteId)
        .single();
      
      if (error || !quote) {
        return Response.json({ success: false, error: 'Quote not found' }, { status: 404 });
      }

      // Check ownership
      const quoteCustomerId = quote.inquiry?.customer_id || quote.inquiry?.customer?.id;
      if (!isAdmin && quoteCustomerId !== customer.id) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      
      return Response.json({ success: true, quote });
    }
    
    // List quotes by inquiry
    if (inquiryId) {
      // Check inquiry ownership
      const { data: inquiry } = await getSupabase()
        .from('inquiries')
        .select('id, customer_id')
        .eq('id', inquiryId)
        .single();

      if (!inquiry) {
        return Response.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
      }

      if (!isAdmin && inquiry.customer_id !== customer.id) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const { data: quotes, error } = await getSupabase()
        .from('quotes')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      
      return Response.json({ success: true, quotes: quotes || [] });
    }
    
    if (!isAdmin) {
      // Customer can only see their own quotes
      let query = getSupabase()
        .from('quotes')
        .select(`
          *,
          inquiry:inquiry_id!inner (customer_id)
        `)
        .eq('inquiry.customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data: quotes, error } = await query;
      if (error) throw error;
      
      return Response.json({ success: true, quotes: quotes || [] });
    }
    
    // Admin: full list with filters
    let query = getSupabase()
      .from('quotes')
      .select(`
        *,
        inquiry:inquiry_id (
          customer:customer_id (contact_name, company_name, email)
        ),
        created_by_user:created_by (email)
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: quotes, error } = await query;
    if (error) throw error;
    
    return Response.json({ success: true, quotes: quotes || [] });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return Response.json({ success: false, error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const authResult = await getAuthenticatedCustomer(request);
    if (!authResult) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { user, customer } = authResult;
    
    switch (action) {
      case 'generate': {
        const { inquiryId, options } = data;
        const result = await generateQuote(inquiryId, user.id, options);
        return Response.json(result);
      }
      
      case 'send': {
        const { quoteId } = data;
        const result = await sendQuote(quoteId, user.id);
        return Response.json(result);
      }
      
      case 'revise': {
        const { quoteId, options } = data;
        const result = await reviseQuote(quoteId, user.id, options);
        return Response.json(result);
      }
      
      case 'accept': {
        const { quoteId } = data;
        const { data: customer } = await getSupabase()
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (!customer) {
          return Response.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }
        
        const result = await acceptQuote(quoteId, customer.id);
        return Response.json(result);
      }
      
      case 'reject': {
        const { quoteId, reason } = data;
        const { data: customer } = await getSupabase()
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (!customer) {
          return Response.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }
        
        const result = await rejectQuote(quoteId, customer.id, reason);
        return Response.json(result);
      }
      
      case 'check_stock': {
        const { items } = data;
        const result = await checkStockAvailability(items);
        return Response.json(result);
      }
      
      default:
        return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in quotes API:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    if (action === 'update_status') {
      const { quoteId, status } = data;
      
      const { data: quote } = await getSupabase()
        .from('quotes')
        .select('id, status')
        .eq('id', quoteId)
        .single();
      
      if (!quote) {
        return Response.json({ success: false, error: 'Quote not found' }, { status: 404 });
      }
      
      // Admin can update to any status
      const { error } = await getSupabase()
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);
      
      if (error) throw error;
      
      return Response.json({ success: true });
    }
    
    if (action === 'extend_validity') {
      const { quoteId, days } = data;
      
      const { data: quote } = await getSupabase()
        .from('quotes')
        .select('valid_until')
        .eq('id', quoteId)
        .single();
      
      if (!quote) {
        return Response.json({ success: false, error: 'Quote not found' }, { status: 404 });
      }
      
      const newValidUntil = new Date(quote.valid_until);
      newValidUntil.setDate(newValidUntil.getDate() + (days || 30));
      
      await getSupabase()
        .from('quotes')
        .update({ valid_until: newValidUntil.toISOString() })
        .eq('id', quoteId);
      
      // Extend reservations
      await getSupabase()
        .from('stock_reservations')
        .update({ expires_at: newValidUntil.toISOString() })
        .eq('quote_id', quoteId)
        .eq('status', 'active');
      
      return Response.json({ success: true, valid_until: newValidUntil.toISOString() });
    }
    
    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating quote:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('id');
    
    if (!quoteId) {
      return Response.json({ success: false, error: 'Quote ID required' }, { status: 400 });
    }
    
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: quote } = await getSupabase()
      .from('quotes')
      .select('status')
      .eq('id', quoteId)
      .single();
    
    if (!quote) {
      return Response.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }
    
    if (quote.status !== 'draft') {
      return Response.json({ success: false, error: 'Can only delete draft quotes' }, { status: 400 });
    }
    
    // Release any reservations
    await getSupabase()
      .from('stock_reservations')
      .update({ status: 'released', released_at: new Date().toISOString(), released_reason: 'quote_deleted' })
      .eq('quote_id', quoteId);
    
    // Delete quote (cascades to items, versions, reservations)
    const { error } = await getSupabase()
      .from('quotes')
      .delete()
      .eq('id', quoteId);
    
    if (error) throw error;
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}