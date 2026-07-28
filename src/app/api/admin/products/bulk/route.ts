import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { validateCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  // CSRF protection for state-changing operations
  const body = await request.json();
  const csrfToken = body._csrf;
  if (!csrfToken || !validateCsrfToken(csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { action, productIds, collectionId } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No product IDs provided' }, { status: 400 });
  }

  try {
    if (action === 'activate') {
      const { error } = await supabase
        .from('products')
        .update({ is_active: true })
        .in('id', productIds);
      if (error) throw error;
    } else if (action === 'deactivate') {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', productIds);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase.from('products').delete().in('id', productIds);
      if (error) throw error;
    } else if (action === 'change_collection') {
      if (!collectionId) {
        return NextResponse.json({ success: false, error: 'Collection ID required' }, { status: 400 });
      }
      const { error } = await supabase
        .from('products')
        .update({ collection_id: collectionId })
        .in('id', productIds);
      if (error) throw error;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}