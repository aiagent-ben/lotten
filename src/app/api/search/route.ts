import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, SearchFilters } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sort = searchParams.get('sort') || 'sort_order:asc';
    
    const filters: SearchFilters = {};
    
    if (searchParams.get('collection')) {
      filters.collection = searchParams.get('collection')!;
    }
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!;
    }
    if (searchParams.get('material')) {
      filters.material = searchParams.get('material')!;
    }
    if (searchParams.get('finish')) {
      filters.finish = searchParams.get('finish')!;
    }
    if (searchParams.get('minPrice')) {
      filters.minPrice = parseFloat(searchParams.get('minPrice')!);
    }
    if (searchParams.get('maxPrice')) {
      filters.maxPrice = parseFloat(searchParams.get('maxPrice')!);
    }
    if (searchParams.get('minWidth')) {
      filters.minWidth = parseInt(searchParams.get('minWidth')!);
    }
    if (searchParams.get('maxWidth')) {
      filters.maxWidth = parseInt(searchParams.get('maxWidth')!);
    }
    if (searchParams.get('minDepth')) {
      filters.minDepth = parseInt(searchParams.get('minDepth')!);
    }
    if (searchParams.get('maxDepth')) {
      filters.maxDepth = parseInt(searchParams.get('maxDepth')!);
    }
    if (searchParams.get('minHeight')) {
      filters.minHeight = parseInt(searchParams.get('minHeight')!);
    }
    if (searchParams.get('maxHeight')) {
      filters.maxHeight = parseInt(searchParams.get('maxHeight')!);
    }
    if (searchParams.get('roomType')) {
      filters.roomType = searchParams.get('roomType')!;
    }
    if (searchParams.get('style')) {
      filters.style = searchParams.get('style')!;
    }
    if (searchParams.get('inStock') === 'true') {
      filters.inStock = true;
    }
    if (searchParams.get('isNew') === 'true') {
      filters.isNew = true;
    }
    if (searchParams.get('isBestseller') === 'true') {
      filters.isBestseller = true;
    }
    
    const sortArray = sort.split(',');
    
    const result = await searchProducts(query, filters, page, limit, sortArray);
    
    return NextResponse.json({
      success: true,
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.estimatedTotalHits / limit),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}