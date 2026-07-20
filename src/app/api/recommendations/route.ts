import { NextResponse } from 'next/server';
import { getAllRecommendations } from '@/lib/recommendations/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const recentlyViewed = searchParams.get('recentlyViewed')?.split(',').filter(Boolean) || [];

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const recommendations = await getAllRecommendations(productId, recentlyViewed);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}