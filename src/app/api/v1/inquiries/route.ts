import { createServiceClient } from '@/lib/db/client';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { 
  createInquiry, 
  addInquiryItem, 
  updateInquiryItem, 
  removeInquiryItem, 
  submitInquiry,
  mergeInquiryOnLogin 
} from '@/lib/actions/inquiry';

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
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }
  
  return sessionId;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    
    if (sessionId) {
      // Get anonymous inquiry
      const { data: inquiry } = await getSupabase()
        .from('inquiries')
        .select(`
          *,
          inquiry_items (
            *,
            product:product_id (id, name, slug, price_usd, images:product_images!product_id (url, alt_text, is_primary)),
            variant:variant_id (id, name, price_usd)
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', status || 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (inquiry) {
        return Response.json({ success: true, inquiry });
      }
      
      return Response.json({ success: true, inquiry: null });
    }
    
    // Authenticated user inquiries
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: customer } = await getSupabase()
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return Response.json({ success: false, error: 'Customer profile not found' }, { status: 404 });
    }
    
    let query = getSupabase()
      .from('inquiries')
      .select(`
        *,
        inquiry_items (
          *,
          product:product_id (id, name, slug, price_usd, images:product_images!product_id (url, alt_text, is_primary)),
          variant:variant_id (id, name, price_usd)
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: inquiries, error } = await query;
    
    if (error) throw error;
    
    return Response.json({ success: true, inquiries: inquiries || [] });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return Response.json({ success: false, error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'create': {
        const result = await createInquiry(data.customerId);
        return Response.json(result);
      }
      
      case 'add_item': {
        const { inquiryId, productId, variantId, quantity, configuration } = data;
        const result = await addInquiryItem(inquiryId, productId, variantId, quantity, configuration);
        return Response.json(result);
      }
      
      case 'update_item': {
        const { itemId, quantity, configuration, notes } = data;
        const result = await updateInquiryItem(itemId, { quantity, configuration, notes });
        return Response.json(result);
      }
      
      case 'remove_item': {
        const { itemId } = data;
        const result = await removeInquiryItem(itemId);
        return Response.json(result);
      }
      
      case 'submit': {
        const { inquiryId } = data;
        const result = await submitInquiry(inquiryId);
        return Response.json(result);
      }
      
      case 'merge_on_login': {
        const { sessionId, customerId } = data;
        const result = await mergeInquiryOnLogin(sessionId, customerId);
        return Response.json(result);
      }
      
      default:
        return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in inquiries API:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    if (action === 'update_inquiry') {
      // Update inquiry fields (notes, status, etc.)
      const { inquiryId, updates } = data;
      const { error } = await getSupabase()
        .from('inquiries')
        .update(updates)
        .eq('id', inquiryId);
      
      if (error) throw error;
      
      return Response.json({ success: true });
    }
    
    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return Response.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }
    
    const result = await removeInquiryItem(itemId);
    return Response.json(result);
  } catch (error) {
    console.error('Error deleting inquiry item:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}