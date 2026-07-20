import { createServiceClient } from '@/lib/db/client';

export interface FunnelStep {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface ConversionFunnel {
  funnelName: string;
  steps: FunnelStep[];
  overallConversionRate: number;
  totalEntries: number;
  totalConversions: number;
}

export interface CohortAnalysis {
  cohortId: string;
  period: string;
  size: number;
  retention: number[];
  revenue: number[];
  orders: number[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueByPeriod: { period: string; revenue: number }[];
  revenueByChannel: { channel: string; revenue: number }[];
  revenueByCategory: { category: string; revenue: number }[];
}

export interface TopProducts {
  productId: string;
  name: string;
  slug: string;
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface AnalyticsEngine {
  getConversionFunnel(funnelType: 'view_to_order' | 'cart_to_order' | 'checkout_to_order'): Promise<ConversionFunnel>;
  getCohortAnalysis(cohortType: 'monthly' | 'weekly', periods: number): Promise<CohortAnalysis[]>;
  getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics>;
  getTopProducts(limit: number, period: 'week' | 'month' | 'quarter'): Promise<TopProducts[]>;
  trackEvent(eventType: string, properties: Record<string, any>): Promise<void>;
  getProductRecommendations(productId: string, userId?: string): Promise<any[]>;
}

const supabase = createServiceClient();

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  funnelType: 'view_to_order' | 'cart_to_order' | 'checkout_to_order',
  startDate: Date,
  endDate: Date
): Promise<ConversionFunnel> {
  const steps: FunnelStep[] = [];

  if (funnelType === 'view_to_order') {
    // Step 1: Product views
    const { count: views } = await supabase
      .from('order_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Step 2: Add to cart
    const { count: addToCart } = await supabase
      .from('order_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'add_to_cart')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Step 3: Checkout start
    const { count: checkoutStart } = await supabase
      .from('order_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'checkout_start')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Step 4: Order complete
    const { count: orders } = await supabase
      .from('order_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'order_complete')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const funnelSteps = [
      { name: 'Product View', count: views || 0 },
      { name: 'Add to Cart', count: addToCart || 0 },
      { name: 'Checkout Start', count: checkoutStart || 0 },
      { name: 'Order Complete', count: orders || 0 },
    ];

    const funnelStepsWithRates = funnelSteps.map((step, index) => {
      const prevCount = index === 0 ? funnelSteps[0].count : funnelSteps[index - 1].count;
      return {
        ...step,
        conversionRate: index === 0 ? 100 : (step.count / prevCount) * 100,
        dropoffRate: index === 0 ? 0 : ((prevCount - step.count) / prevCount) * 100,
      };
    });

    return {
      funnelName: 'Product View to Order',
      steps: funnelStepsWithRates,
      overallConversionRate: (orders || 0) / (views || 1) * 100,
      totalEntries: views || 0,
      totalConversions: orders || 0,
    };
  }

  // Cart to Order funnel
  const { count: cartViews } = await supabase
    .from('order_analytics')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'cart_view')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { count: checkouts } = await supabase
    .from('order_analytics')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'checkout_start')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { count: orders } = await supabase
    .from('order_analytics')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'order_complete')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const cartFunnelSteps = [
    { name: 'Cart View', count: cartViews || 0 },
    { name: 'Checkout Start', count: checkouts || 0 },
    { name: 'Order Complete', count: orders || 0 },
  ];

  const cartFunnelWithRates = cartFunnelSteps.map((step, index) => {
    const prevCount = index === 0 ? cartFunnelSteps[0].count : cartFunnelSteps[index - 1].count;
    return {
      ...step,
      conversionRate: index === 0 ? 100 : (step.count / prevCount) * 100,
      dropoffRate: index === 0 ? 0 : ((prevCount - step.count) / prevCount) * 100,
    };
  });

  return {
    funnelName: 'Cart to Order',
    steps: cartFunnelWithRates,
    overallConversionRate: (orders || 0) / (cartViews || 1) * 100,
    totalEntries: cartViews || 0,
    totalConversions: orders || 0,
  };
}

/**
 * Get cohort analysis
 */
export async function getCohortAnalysis(
  cohortType: 'monthly' | 'weekly',
  periods: number = 12
): Promise<CohortAnalysis[]> {
  const endDate = new Date();
  const startDate = new Date();
  
  if (cohortType === 'monthly') {
    startDate.setMonth(startDate.getMonth() - periods);
  } else {
    startDate.setDate(startDate.getDate() - periods * 7);
  }

  // Get all orders in the period
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_id, total_usd, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('status', 'in', '("cancelled")');

  if (error) {
    console.error('Error fetching orders for cohort analysis:', error);
    return [];
  }

  // Group by cohort
  const cohorts = new Map<string, Set<string>>();
  const cohortOrdersMap = new Map<string, any[]>();

  for (const order of orders || []) {
    const date = new Date(order.created_at);
    let cohortId: string;
    
    if (cohortType === 'monthly') {
      cohortId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const week = Math.ceil(date.getDate() / 7);
      cohortId = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }

    if (!cohorts.has(cohortId)) {
      cohorts.set(cohortId, new Set());
      cohortOrdersMap.set(cohortId, []);
    }
    
    cohorts.get(cohortId)!.add(order.customer_id);
    cohortOrdersMap.get(cohortId)!.push(order);
  }

  // Calculate retention for each cohort
  const results: CohortAnalysis[] = [];

  for (const [cohortId, customers] of cohorts.entries()) {
    const cohortOrders = cohortOrdersMap.get(cohortId) || [];
    const cohortSize = customers.size;
    const totalRevenue = cohortOrders.reduce((sum, o) => sum + (o.total_usd || 0), 0);
    const totalOrders = cohortOrders.length;

    // Calculate retention over periods
    const retention: number[] = [];
    const revenue: number[] = [];
    const orderCounts: number[] = [];

    for (let i = 0; i < periods; i++) {
      const periodStart = new Date();
      const periodEnd = new Date();
      
      if (cohortType === 'monthly') {
        const cohortDate = new Date(cohortId + '-01');
        periodStart.setMonth(cohortDate.getMonth() + i);
        periodStart.setDate(1);
        periodEnd.setMonth(periodStart.getMonth() + 1);
        periodEnd.setDate(0);
      } else {
        // weekly
      }

      // Find returning customers in this period
      const returningCustomers = new Set<string>();
      let periodRevenue = 0;
      let periodOrdersCount = 0;

      // This would need more complex queries in real implementation
      retention.push(0); // placeholder
      revenue.push(0);
      orderCounts.push(0);
    }

    results.push({
      cohortId,
      period: cohortId,
      size: cohortSize,
      retention,
      revenue,
      orders: orderCounts,
    });
  }

  return results.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(
  startDate: Date,
  endDate: Date
): Promise<RevenueMetrics> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_usd, created_at, customer_id, shipping_address')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('status', 'in', '("cancelled")');

  if (error) {
    console.error('Error fetching revenue metrics:', error);
    return {
      totalRevenue: 0,
      averageOrderValue: 0,
      revenueByPeriod: [],
      revenueByChannel: [],
      revenueByCategory: [],
    };
  }

  const ordersData = orders || [];
  const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_usd || 0), 0);
  const averageOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0;

  // Revenue by period (daily/weekly)
  const revenueByPeriod = new Map<string, number>();
  for (const order of ordersData) {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    revenueByPeriod.set(date, (revenueByPeriod.get(date) || 0) + (order.total_usd || 0));
  }

  const revenueByPeriodArray = Array.from(revenueByPeriod.entries())
    .map(([period, revenue]) => ({ period, revenue }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Revenue by channel (shipping method as proxy)
  const revenueByChannel = new Map<string, number>();
  for (const order of ordersData) {
    // Use shipping method or default
    const channel = 'web'; // placeholder
    revenueByChannel.set(channel, (revenueByChannel.get(channel) || 0) + (order.total_usd || 0));
  }

  // Revenue by category (from order items)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, product_id, quantity, unit_price_usd, line_total_usd')
    .in('order_id', ordersData.map(o => o.id));

  const revenueByCategory = new Map<string, number>();
  if (orderItems) {
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('collection_id')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        const { data: collection } = await supabase
          .from('collections')
          .select('name')
          .eq('id', product.collection_id)
          .single();
        
        const category = collection?.name || 'Unknown';
        revenueByCategory.set(category, (revenueByCategory.get(category) || 0) + (item.line_total_usd || 0));
      }
    }
  }

  return {
    totalRevenue,
    averageOrderValue,
    revenueByPeriod: revenueByPeriodArray,
    revenueByChannel: Array.from(revenueByChannel.entries()).map(([channel, revenue]) => ({ channel, revenue })),
    revenueByCategory: Array.from(revenueByCategory.entries()).map(([category, revenue]) => ({ category, revenue })),
  };
}

/**
 * Get top products by various metrics
 */
export async function getTopProducts(
  limit: number = 10,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<TopProducts[]> {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  // Get views from analytics
  const { data: views } = await supabase
    .from('order_analytics')
    .select('product_id, event_type')
    .eq('event_type', 'view')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get orders
  const { data: orders } = await supabase
    .from('order_analytics')
    .select('product_id, event_type, value_usd')
    .eq('event_type', 'order_complete')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Aggregate views
  const viewsByProduct = new Map<string, number>();
  if (views) {
    for (const v of views) {
      if (v.product_id) {
        viewsByProduct.set(v.product_id, (viewsByProduct.get(v.product_id) || 0) + 1);
      }
    }
  }

  // Aggregate orders and revenue
  const ordersByProduct = new Map<string, { orders: number; revenue: number }>();
  if (orders) {
    for (const o of orders) {
      if (o.product_id) {
        const existing = ordersByProduct.get(o.product_id) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += o.value_usd || 0;
        ordersByProduct.set(o.product_id, existing);
      }
    }
  }

  // Get all product IDs
  const allProductIds = new Set([...viewsByProduct.keys(), ...ordersByProduct.keys()]);
  
  // Fetch product details
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price_usd, images:product_images!product_id(url, alt_text, is_primary)')
    .in('id', Array.from(allProductIds));

  const productsMap = new Map(products?.map(p => [p.id, p]) || []);

  // Build results
  const results: TopProducts[] = [];
  
  for (const productId of allProductIds) {
    const product = productsMap.get(productId);
    if (!product) continue;

    const views = viewsByProduct.get(productId) || 0;
    const orderData = ordersByProduct.get(productId) || { orders: 0, revenue: 0 };
    const conversionRate = views > 0 ? (orderData.orders / views) * 100 : 0;

    results.push({
      productId,
      name: product.name,
      slug: product.slug,
      views,
      orders: orderData.orders,
      revenue: orderData.revenue,
      conversionRate,
    });
  }

  // Sort by revenue descending
  results.sort((a, b) => b.revenue - a.revenue);

  return results.slice(0, limit);
}

/**
 * Track analytics event
 */
export async function trackEvent(
  eventType: 'view' | 'add_to_cart' | 'cart_view' | 'checkout_start' | 'order_complete' | 'search',
  properties: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('order_analytics').insert({
      event_type: eventType,
      product_id: properties.productId,
      customer_id: properties.customerId,
      session_id: properties.sessionId,
      value_usd: properties.value,
      metadata: properties,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Get product recommendations using collaborative filtering
 */
export async function getProductRecommendations(
  productId: string,
  userId?: string,
  limit = 4
): Promise<any[]> {
  // Get co-purchased products
  // First get order IDs that contain this product
  const { data: orderIdsData } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('product_id', productId);

  const orderIds = orderIdsData?.map(item => item.order_id) || [];

  // Get co-purchased products
  const { data: coPurchased } = await supabase
    .from('order_items')
    .select('product_id, order_id')
    .neq('product_id', productId)
    .in('order_id', orderIds)
    .limit(20);

  // Count co-occurrence
  const coOccurrence = new Map<string, number>();
  if (coPurchased) {
    for (const item of coPurchased) {
      coOccurrence.set(item.product_id, (coOccurrence.get(item.product_id) || 0) + 1);
    }
  }

  // Sort by frequency
  const topCoPurchased = Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId]) => productId);

  // Get product details
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price_usd, stock_available, images:product_images!product_id(url, alt_text, is_primary)')
    .in('id', topCoPurchased)
    .eq('is_active', true)
    .limit(limit);

  return products || [];
}