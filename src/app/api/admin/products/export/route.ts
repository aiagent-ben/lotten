import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET() {
  const supabase = createServiceClient();

  const { data: products, error } = await supabase
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
      created_at,
      collections:collection_id (name)
    `
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    'ID',
    'Article No',
    'Name',
    'Slug',
    'Collection',
    'Price (MYR)',
    'Stock Available',
    'Stock Reserved',
    'Active',
    'New',
    'Bestseller',
    'Created At',
  ];

  const rows = (products || []).map((p) => {
    const coll = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    const collectionName = coll?.name || '';
    return [
      p.id,
      p.article_no,
      p.name,
      p.slug,
      collectionName,
      p.price_usd.toString(),
      p.stock_available.toString(),
      p.stock_reserved.toString(),
      p.is_active ? 'Yes' : 'No',
      p.is_new ? 'Yes' : 'No',
      p.is_bestseller ? 'Yes' : 'No',
      p.created_at,
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}