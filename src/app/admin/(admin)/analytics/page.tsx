import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/db/client';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Analytics | Lotten Admin',
};

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  slug: string;
  price_usd: number;
  total_revenue: number;
  total_quantity: number;
  orders_count: number;
}

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

async function fetchAnalytics() {
  const supabase = createServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: revenueData },
    { data: topProducts },
    { data: funnelData },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        status,
        total_usd,
        currency,
        created_at,
        customers:customer_id (id, contact_name, company_name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('total_usd, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('status', 'cancelled'),
    supabase
      .from('order_items')
      .select(
        `
        quantity,
        unit_price_usd,
        line_total_usd,
        products:product_id (id, name, slug, price_usd)
      `
      )
      .limit(100),
    supabase
      .from('order_analytics')
      .select('event_type')
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ]);

  // Process revenue data (last 30 days)
  const revenueMap = new Map<string, { revenue: number; orders: number }>();
  if (revenueData) {
    for (const order of revenueData) {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const existing = revenueMap.get(date) || { revenue: 0, orders: 0 };
      existing.revenue += order.total_usd || 0;
      existing.orders += 1;
      revenueMap.set(date, existing);
    }
  }

  const revenueChartData: RevenueData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const data = revenueMap.get(date) || { revenue: 0, orders: 0 };
    revenueChartData.push({ date, revenue: data.revenue, orders: data.orders });
  }

  // Process top products
  const productMap = new Map<string, TopProduct>();
  if (topProducts) {
    for (const item of topProducts) {
      const product = item.products as unknown as { id: string; name: string; slug: string; price_usd: number } | null;
      if (!product) continue;

      const existing = productMap.get(product.id) || {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price_usd: product.price_usd,
        total_revenue: 0,
        total_quantity: 0,
        orders_count: 0,
      };

      existing.total_revenue += item.line_total_usd || 0;
      existing.total_quantity += item.quantity || 0;
      existing.orders_count += 1;
      productMap.set(product.id, existing);
    }
  }

  const topProductsArray = Array.from(productMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  // Process funnel data
  const funnelStages = ['view', 'add_to_cart', 'checkout_start', 'order_complete'];
  const funnelCounts: Record<string, number> = {};
  if (funnelData) {
    for (const event of funnelData) {
      funnelCounts[event.event_type] = (funnelCounts[event.event_type] || 0) + 1;
    }
  }

  const funnelChartData: FunnelData[] = funnelStages.map((stage, index) => {
    const count = funnelCounts[stage] || 0;
    const base = funnelCounts['view'] || 1;
    return {
      stage: stage.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
      percentage: (count / base) * 100,
    };
  });

  const totalRevenue = revenueChartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders30d = revenueChartData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders30d > 0 ? totalRevenue / totalOrders30d : 0;

  return {
    stats: {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalRevenue,
      totalOrders30d,
      avgOrderValue,
    },
    recentOrders: recentOrders || [],
    revenueChartData,
    topProducts: topProductsArray,
    funnelChartData,
  };
}

export default async function AnalyticsPage() {
  const data = await fetchAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Analytics Dashboard</h1>
          <p className="body text-gray-600 mt-1">Overview of store performance (last 30 days)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={data.stats.totalProducts.toLocaleString()}
          subtitle={`${data.stats.activeProducts} active`}
          icon={<ProductIcon />}
        />
        <StatCard
          title="Total Orders"
          value={data.stats.totalOrders.toLocaleString()}
          subtitle={`${data.stats.pendingOrders} pending`}
          icon={<OrderIcon />}
        />
        <StatCard
          title="Total Customers"
          value={data.stats.totalCustomers.toLocaleString()}
          subtitle="Active accounts"
          icon={<CustomerIcon />}
        />
        <StatCard
          title="Revenue (30d)"
          value={formatPrice(data.stats.totalRevenue)}
          subtitle={`${data.stats.totalOrders30d} orders • AOV ${formatPrice(data.stats.avgOrderValue)}`}
          icon={<RevenueIcon />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Revenue Trend (30 Days)</h2>
          </div>
          <div className="card-content">
            <RevenueChart data={data.revenueChartData} />
          </div>
        </div>

        {/* Funnel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Conversion Funnel (30 Days)</h2>
          </div>
          <div className="card-content">
            <FunnelChart data={data.funnelChartData} />
          </div>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Products by Revenue</h2>
          </div>
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>Product</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-center">Qty Sold</th>
                    <th className="text-center">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="mt-2">No order data yet</p>
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/products/${product.slug}`} target="_blank" className="font-medium text-gray-900 hover:text-primary">
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-400 font-mono">#{product.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatPrice(product.total_revenue)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{product.total_quantity}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{product.orders_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Orders</h2>
          </div>
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <p>No orders yet</p>
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {order.customers?.[0]?.contact_name || order.customers?.[0]?.company_name || order.customers?.[0]?.email}
                          </p>
                          <p className="text-xs text-gray-400">{order.customers?.[0]?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatPrice(order.total_usd || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="heading-3 text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
          {Icon}
        </div>
      </div>
    </div>
  );
}

function ProductIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const width = 100;
  const height = 200;

  return (
    <div className="h-64 relative">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full" role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g stroke="#e5e7eb" strokeWidth="0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={40}
              y1={height - height * ratio + 10}
              x2={width - 10}
              y2={height - height * ratio + 10}
            />
          ))}
        </g>

        {/* Area */}
        <path
          d={[
            `M 40 ${height + 10}`,
            ...data.map((d, i) => {
              const x = 40 + (i / (data.length - 1)) * (width - 50);
              const y = height + 10 - (d.revenue / maxRevenue) * height;
              return i === 0 ? `L ${x} ${y}` : `L ${x} ${y}`;
            }),
            `L ${width - 10} ${height + 10}`,
            'Z',
          ].join(' ')}
          fill="url(#revenueGradient)"
        />

        {/* Line */}
        <path
          d={data
            .map((d, i) => {
              const x = 40 + (i / (data.length - 1)) * (width - 50);
              const y = height + 10 - (d.revenue / maxRevenue) * height;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')}
          stroke="#f59e0b"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={40 + (i / (data.length - 1)) * (width - 50)}
            cy={height + 10 - (d.revenue / maxRevenue) * height}
            r={3}
            fill="#f59e0b"
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Y-axis labels */}
        <g fontSize="8" fill="#9ca3af" textAnchor="end">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <text key={ratio} x={38} y={height - height * ratio + 13} dominantBaseline="middle">
              {formatPrice(maxRevenue * ratio)}
            </text>
          ))}
        </g>

        {/* X-axis labels */}
        <g fontSize="8" fill="#9ca3af" textAnchor="middle">
          {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d, idx) => {
            const i = data.indexOf(d);
            const x = 40 + (i / (data.length - 1)) * (width - 50);
            return (
              <text key={idx} x={x} y={height + 25} dominantBaseline="hanging">
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function FunnelChart({ data }: { data: Array<{ stage: string; count: number; percentage: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barHeight = 40;
  const gap = 8;
  const labelWidth = 120;
  const barMaxWidth = 300;

  return (
    <div className="space-y-4" role="img" aria-label="Conversion funnel">
      {data.map((stage, i) => (
        <div key={stage.stage} className="flex items-center gap-4">
          <div className="w-[120px] text-right text-sm text-gray-600 font-medium">{stage.stage}</div>
          <div className="flex-1 max-w-[300px] relative">
            <div
              className="bg-primary-100 rounded-lg h-10"
              style={{ width: `${(stage.count / maxCount) * 100}%` }}
              role="progressbar"
              aria-valuenow={stage.count}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-label={`${stage.stage}: ${stage.count}`}
            >
              <div className="bg-primary-600 h-full rounded-lg flex items-center justify-end pr-2 text-white text-xs font-medium">
                {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
          {i > 0 && (
            <div className="w-16 text-center text-sm text-gray-500">
              {data[i - 1].count > 0 ? `${((stage.count / data[i - 1].count) * 100).toFixed(1)}%` : 'N/A'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'badge-warning';
    case 'confirmed':
    case 'production':
      return 'badge-info';
    case 'shipped':
      return 'badge-secondary';
    case 'delivered':
      return 'badge-success';
    case 'cancelled':
      return 'badge-destructive';
    default:
      return 'badge';
  }
}