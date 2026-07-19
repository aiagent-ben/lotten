import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const search = searchParams.get('search') || '';
  const collectionFilter = searchParams.get('collection') || '';
  const statusFilter = searchParams.get('status') || '';

  let query = supabase
    .from('products')
    .select(
      `
      id,
      article_no,
      name,
      slug,
      collection_id,
      price_usd,
      stock_available,
      stock_reserved,
      is_active,
      is_new,
      is_bestseller,
      sort_order,
      created_at,
      collections:collection_id (id, name, slug),
      images:product_images!product_id (url, is_primary, sort_order)
    `,
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,article_no.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  if (collectionFilter) {
    query = query.eq('collection_id', collectionFilter);
  }

  if (statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  } else if (statusFilter === 'new') {
    query = query.eq('is_new', true);
  } else if (statusFilter === 'bestseller') {
    query = query.eq('is_bestseller', true);
  } else if (statusFilter === 'low_stock') {
    query = query.lte('stock_available', 5);
  } else if (statusFilter === 'out_of_stock') {
    query = query.eq('stock_available', 0);
  }

  const { data: products, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedProducts = (products || []).map((p) => {
    const coll = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    return {
      ...p,
      collections: coll ? { id: coll.id, name: coll.name, slug: coll.slug } : null,
      images: p.images?.map((i) => ({ url: i.url, is_primary: i.is_primary, sort_order: i.sort_order })) || [],
    };
  });

  return NextResponse.json({
    data: typedProducts,
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
  });
}

export async function POST(request: Request) {
  const supabase = createServiceClient();

  const body = await request.json();
  const { action, productIds, collectionId } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No product IDs provided' }, { status: 400 });
  }

  try {
    if (action === 'activate') {
      const { error } = await supabase.from('products').update({ is_active: true }).in('id', productIds);
      if (error) throw error;
    } else if (action === 'deactivate') {
      const { error } = await supabase.from('products').update({ is_active: false }).in('id', productIds);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabase.from('products').delete().in('id', productIds);
      if (error) throw error;
    } else if (action === 'change_collection' && collectionId) {
      const { error } = await supabase.from('products').update({ collection_id: collectionId }).in('id', productIds);
      if (error) throw error;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}