import { createServiceClient } from '@/lib/db/client';

export interface StockInfo {
  productId: string;
  variantId: string | null;
  available: number;
  reserved: number;
  incoming: number;
  lowStockThreshold: number;
  netAvailable: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder_allowed';
}

export interface ReserveStockResult {
  success: boolean;
  productId: string;
  variantId: string | null;
  reserved: number;
  error?: string;
}

export interface ReleaseStockResult {
  success: boolean;
  productId: string;
  variantId: string | null;
  released: number;
  error?: string;
}

/**
 * Get stock information for a product (and optionally a variant)
 */
export async function getStockInfo(
  productId: string,
  variantId?: string
): Promise<StockInfo | null> {
  const supabase = createServiceClient();

  if (variantId) {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select('id, product_id, stock_available, stock_reserved, stock_incoming')
      .eq('id', variantId)
      .single();

    if (error || !variant) return null;

    const { data: product } = await supabase
      .from('products')
      .select('low_stock_threshold')
      .eq('id', productId)
      .single();

    return buildStockInfo(variant.product_id, variant.id, variant, product?.low_stock_threshold ?? 5);
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('id, stock_available, stock_reserved, stock_incoming, low_stock_threshold')
    .eq('id', productId)
    .single();

  if (error || !product) return null;

  return buildStockInfo(product.id, null, product, product.low_stock_threshold);
}

function buildStockInfo(
  productId: string,
  variantId: string | null,
  stock: { stock_available: number; stock_reserved: number; stock_incoming: number },
  lowStockThreshold: number
): StockInfo {
  const netAvailable = stock.stock_available - stock.stock_reserved;
  let status: StockInfo['status'] = 'in_stock';

  if (netAvailable <= 0) {
    status = 'out_of_stock';
  } else if (netAvailable <= lowStockThreshold) {
    status = 'low_stock';
  }

  return {
    productId,
    variantId,
    available: stock.stock_available,
    reserved: stock.stock_reserved,
    incoming: stock.stock_incoming,
    lowStockThreshold,
    netAvailable,
    status,
  };
}

/**
 * Get stock info for multiple products at once
 */
export async function getBulkStockInfo(
  productIds: string[]
): Promise<Map<string, StockInfo>> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, stock_available, stock_reserved, stock_incoming, low_stock_threshold')
    .in('id', productIds);

  const result = new Map<string, StockInfo>();

  if (products) {
    for (const p of products) {
      result.set(p.id, buildStockInfo(p.id, null, p, p.low_stock_threshold));
    }
  }

  return result;
}

/**
 * Reserve stock for an order (decrement available, increment reserved)
 * Call this at checkout/order creation
 */
export async function reserveStock(
  items: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<ReserveStockResult[]> {
  const supabase = createServiceClient();
  const results: ReserveStockResult[] = [];

  for (const item of items) {
    const table = item.variantId ? 'product_variants' : 'products';
    const id = item.variantId ?? item.productId;

    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('stock_available, stock_reserved')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: 0,
        error: 'Product/variant not found',
      });
      continue;
    }

    const available = current.stock_available - current.stock_reserved;
    if (available < item.quantity) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: 0,
        error: `Insufficient stock: ${available} available, ${item.quantity} requested`,
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({
        stock_reserved: current.stock_reserved + item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: 0,
        error: updateError.message,
      });
    } else {
      results.push({
        success: true,
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: item.quantity,
      });
    }
  }

  return results;
}

/**
 * Release reserved stock (increment available, decrement reserved)
 * Call this on order cancellation/refund
 */
export async function releaseStock(
  items: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<ReleaseStockResult[]> {
  const supabase = createServiceClient();
  const results: ReleaseStockResult[] = [];

  for (const item of items) {
    const table = item.variantId ? 'product_variants' : 'products';
    const id = item.variantId ?? item.productId;

    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('stock_available, stock_reserved')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: 0,
        error: 'Product/variant not found',
      });
      continue;
    }

    const toRelease = Math.min(item.quantity, current.stock_reserved);

    const { error: updateError } = await supabase
      .from(table)
      .update({
        stock_reserved: current.stock_reserved - toRelease,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: 0,
        error: updateError.message,
      });
    } else {
      results.push({
        success: true,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: toRelease,
      });
    }
  }

  return results;
}

/**
 * Confirm shipment (decrement available stock)
 * Call this when order status changes to 'shipped'
 */
export async function confirmShipment(
  items: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<ReleaseStockResult[]> {
  const supabase = createServiceClient();
  const results: ReleaseStockResult[] = [];

  for (const item of items) {
    const table = item.variantId ? 'product_variants' : 'products';
    const id = item.variantId ?? item.productId;

    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('stock_available, stock_reserved')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: 0,
        error: 'Product/variant not found',
      });
      continue;
    }

    // Decrement both available and reserved
    const newAvailable = Math.max(0, current.stock_available - item.quantity);
    const newReserved = Math.max(0, current.stock_reserved - item.quantity);

    const { error: updateError } = await supabase
      .from(table)
      .update({
        stock_available: newAvailable,
        stock_reserved: newReserved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      results.push({
        success: false,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: 0,
        error: updateError.message,
      });
    } else {
      results.push({
        success: true,
        productId: item.productId,
        variantId: item.variantId ?? null,
        released: item.quantity,
      });
    }
  }

  return results;
}

/**
 * Receive incoming stock (move from incoming to available)
 */
export async function receiveIncomingStock(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<ReleaseStockResult> {
  const supabase = createServiceClient();
  const table = variantId ? 'product_variants' : 'products';
  const id = variantId ?? productId;

  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select('stock_available, stock_incoming')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return {
      success: false,
      productId,
      variantId: variantId ?? null,
      released: 0,
      error: 'Product/variant not found',
    };
  }

  const toReceive = Math.min(quantity, current.stock_incoming);

  const { error: updateError } = await supabase
    .from(table)
    .update({
      stock_available: current.stock_available + toReceive,
      stock_incoming: current.stock_incoming - toReceive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return {
      success: false,
      productId,
      variantId: variantId ?? null,
      released: 0,
      error: updateError.message,
    };
  }

  return {
    success: true,
    productId,
    variantId: variantId ?? null,
    released: toReceive,
  };
}

/**
 * Check if product/variant has sufficient stock for a given quantity
 */
export async function hasSufficientStock(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<{ sufficient: boolean; available: number }> {
  const stock = await getStockInfo(productId, variantId);
  if (!stock) return { sufficient: false, available: 0 };

  return {
    sufficient: stock.netAvailable >= quantity,
    available: stock.netAvailable,
  };
}

/**
 * Get all products with low stock
 */
export async function getLowStockProducts(): Promise<StockInfo[]> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, stock_available, stock_reserved, stock_incoming, low_stock_threshold')
    .eq('is_active', true);

  const results: StockInfo[] = [];

  if (products) {
    for (const p of products) {
      const info = buildStockInfo(p.id, null, p, p.low_stock_threshold);
      if (info.status === 'low_stock' || info.status === 'out_of_stock') {
        results.push(info);
      }
    }
  }

  // Also check variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, product_id, stock_available, stock_reserved, stock_incoming')
    .eq('is_active', true);

  if (variants) {
    for (const v of variants) {
      const { data: product } = await supabase
        .from('products')
        .select('low_stock_threshold')
        .eq('id', v.product_id)
        .single();

      const threshold = (product as { low_stock_threshold?: number } | null)?.low_stock_threshold ?? 5;
      const info = buildStockInfo(v.product_id, v.id, v, threshold);
      if (info.status === 'low_stock' || info.status === 'out_of_stock') {
        results.push(info);
      }
    }
  }

  return results;
}