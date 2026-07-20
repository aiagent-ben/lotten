import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { getStockInfo } from '@/lib/inventory/stock';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const variantIds = searchParams.get('variantIds');
    const singleId = searchParams.get('id');

    // Single product/variant
    if (singleId) {
      const variantId = searchParams.get('variantId') || undefined;
      const stock = await getStockInfo(singleId, variantId);
      
      if (!stock) {
        return NextResponse.json(
          { error: 'Product/variant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: stock });
    }

    // Bulk
    if (ids) {
      const productIds = ids.split(',');
      
      const results = await Promise.all(
        productIds.map(async (id) => {
          const stock = await getStockInfo(id);
          return { productId: id, stock };
        })
      );
      
      const data: Record<string, any> = {};
      for (const item of results) {
        data[item.productId] = item.stock;
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: 'id or ids parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API v1 inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}