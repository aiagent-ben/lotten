import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { getAllActiveProducts, getAllCollections } from '@/lib/data/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const collection = searchParams.get('collection') || '';
    const brand = searchParams.get('brand') || '';
    const isNew = searchParams.get('isNew') === 'true';
    const isBestseller = searchParams.get('isBestseller') === 'true';
    const inStock = searchParams.get('inStock') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sort = searchParams.get('sort') || 'sort_order';

    const products = getAllActiveProducts();

    let filtered = products;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.article_no.toLowerCase().includes(searchLower) ||
        p.slug.toLowerCase().includes(searchLower) ||
        p.short_description?.toLowerCase().includes(searchLower)
      );
    }

    if (collection) {
      filtered = filtered.filter(p => p.collection_id === collection);
    }

    if (brand) {
      // Filter by brand via collection
      const supabase = createServiceClient();
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('brand_id', brand);
      const collectionIds = collections?.map(c => c.id) || [];
      filtered = filtered.filter(p => collectionIds.includes(p.collection_id));
    }

    if (isNew) {
      filtered = filtered.filter(p => p.is_new);
    }

    if (isBestseller) {
      filtered = filtered.filter(p => p.is_bestseller);
    }

    if (inStock) {
      filtered = filtered.filter(p => p.stock_available > 0);
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.price_usd >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price_usd <= maxPrice);
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'bestselling':
        filtered.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
      default:
        filtered.sort((a, b) => a.sort_order - b.sort_order);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const response = NextResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

    // Cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('API v1 products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}