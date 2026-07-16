import { Metadata } from 'next';
import { createServiceClient } from '@/lib/db/client';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard | Lotten Admin',
};

interface StatsData {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: {
    id: string;
    order_number: string;
    status: string;
    total_usd: number;
    created_at: string;
    customers: {
      contact_name: string | null;
      company_name: string | null;
      email: string | null;
    } | null;
  }[];
  topProducts: {
    id: string;
    name: string;
    slug: string;
    price_usd: number;
    stock_available: number;
    is_active: boolean;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    slug: string;
    price_usd: number;
    stock_available: number;
    is_active: boolean;
  }[];
}

export default async function DashboardPage() {
  const supabase = createServiceClient();
  
  // Fetch all stats in parallel
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: topProducts },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders')
      .select(`
        id, order_number, status, total_usd, created_at,
        customers:customer_id (contact_name, company_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('products')
      .select('id, name, slug, price_usd, stock_available, is_active')
      .eq('is_active', true)
      .order('stock_available', { ascending: true })
      .limit(5),
    supabase.from('products')
      .select('id, name, slug, stock_available, low_stock_threshold, is_active')
      .eq('is_active', true)
      .lte('stock_available', 10)
      .order('stock_available', { ascending: true })
      .limit(5),
  ]);

  const stats = {
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalRevenue: 0, // Would need aggregate query
    recentOrders: recentOrders || [],
    topProducts: topProducts || [],
    lowStockProducts: lowStockProducts || [],
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      change: `${stats.activeProducts} active`,
      icon: 'package',
      color: 'amber',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: `${stats.pendingOrders} pending`,
      icon: 'shopping_cart',
      color: 'blue',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: 'Active accounts',
      icon: 'users',
      color: 'green',
    },
    {
      title: 'Revenue',
      value: formatPrice(stats.totalRevenue),
      change: 'This month',
      icon: 'dollar',
      color: 'purple',
    },
  ];

  const ICONS: Record<string, React.ReactNode> = {
    package: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    shopping_cart: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    users: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    dollar: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Dashboard</h1>
          <p className="body text-gray-600 mt-1">Overview of your furniture marketplace</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="caption text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="caption text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${stat.color}-100 text-${stat.color}-600`)}>
                  {ICONS[stat.icon]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="card-title">Recent Orders</h2>
              <p className="card-description">Latest orders received</p>
            </div>
            <a href="/admin/orders" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <div className="card-content pt-0">
            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order: any) => (
                  <a key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{order.customers?.contact_name || order.customers?.company_name || order.customers?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 text-sm">{formatPrice(order.total_usd || 0)}</p>
                      <span className="badge badge-warning text-xs">{order.status}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="card-title">Low Stock Alert</h2>
              <p className="card-description">Products needing restock</p>
            </div>
          </div>
          <div className="card-content pt-0">
            {stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>All products well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.slug}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-amber-700">{product.stock_available} remaining</p>
                      <p className="text-xs text-gray-500">Threshold: {product.low_stock_threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/admin/products/new" className="card p-6 hover:shadow-md transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Add Product</p>
              <p className="caption text-gray-500 mt-1">Create new furniture item</p>
            </a>
            
            <a href="/admin/collections/new" className="card p-6 hover:shadow-md transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">New Collection</p>
              <p className="caption text-gray-500 mt-1">Organize products by style</p>
            </a>
            
            <a href="/admin/orders" className="card p-6 hover:shadow-md transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">View Orders</p>
              <p className="caption text-gray-500 mt-1">Manage fulfillment</p>
            </a>
            
            <a href="/admin/settings" className="card p-6 hover:shadow-md transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="caption text-gray-500 mt-1">Configure site options</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}