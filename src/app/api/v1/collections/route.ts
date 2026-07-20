import { NextResponse } from 'next/server';
import { getAllCollections } from '@/lib/data/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const brand = searchParams.get('brand') || '';
    const isActive = searchParams.get('isActive') !== 'false';

    const collections = getAllCollections();

    let filtered: typeof collections = collections;

    if (brand) {
      filtered = filtered.filter((c: typeof collections[0]) => c.brand_id === brand);
    }

    if (!isActive) {
      filtered = filtered.filter((c: typeof collections[0]) => c.is_active);
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

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('API v1 collections error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}