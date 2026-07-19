import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function POST(request: Request) {
  const supabase = createServiceClient();

  const body = await request.json();
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