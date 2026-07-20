import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { getProductById, getProductBySlug, getCollectionBySlug } from '@/lib/data/products';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = createServiceClient();
    
    // Try to find by ID first
    let product = await getProductById(id);
    
    // If not found by ID, try by slug
    if (!product) {
      product = await getProductBySlug(id);
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get collection details
    const collection = getCollectionBySlug(product.collection_id);

    // Get variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('sort_order');

    const response = NextResponse.json({
      data: {
        ...product,
        collection,
        variants: variants || [],
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('API v1 product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}