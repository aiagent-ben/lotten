import { Metadata } from 'next';
import { createServiceClient } from '@/lib/db/client';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Orders | Lotten Admin',
};

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total_usd: number;
  currency: string;
  created_at: string;
  customers: { 
    id: string;
    contact_name: string | null;
    company_name: string | null;
    email: string;
  }[] | null;
  order_items: { id: string; quantity: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  pending: { label: 'Pending', className: 'badge-warning', color: '#f59e0b' },
  confirmed: { label: 'Confirmed', className: 'badge-info', color: '#3b82f6' },
  production: { label: 'In Production', className: 'badge-primary', color: '#8b5cf6' },
  shipped: { label: 'Shipped', className: 'badge-secondary', color: '#06b6d4' },
  delivered: { label: 'Delivered', className: 'badge-success', color: '#10b981' },
  cancelled: { label: 'Cancelled', className: 'badge-destructive', color: '#ef4444' },
};

const STATUS_ORDER = ['pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'];

export default async function OrdersPage() {
  const supabase = createServiceClient();
  
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_usd,
      currency,
      created_at,
      customers:customer_id (id, contact_name, company_name, email),
      order_items:order_items (id, quantity)
    `)
    .order('created_at', { ascending: false })
    .limit(50);
    
  const typedOrders = (orders || []).map((o) => ({
    ...o,
    customers: o.customers?.[0] ?? null,
  })) as OrderData[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Orders</h1>
          <p className="body text-gray-600 mt-1">Manage customer orders and fulfillment</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline btn-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusOrders = typedOrders.filter(o => o.status === status);
          
          return (
            <div key={status} className="bg-gray-50 rounded-xl p-4 min-h-[500px] xl:col-span-1 lg:col-span-2 sm:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <h3 className="font-semibold text-gray-900">{config.label}</h3>
                </div>
                <span className={`badge ${config.className}`}>{statusOrders.length}</span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2">
                {statusOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No orders</p>
                  </div>
                ) : (
                  statusOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{order.order_number}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.customers?.[0]?.contact_name || order.customers?.[0]?.company_name || order.customers?.[0]?.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {order.order_items?.length || 0} items • {formatPrice(order.total_usd || 0)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Table - Alternative View */}
      <details className="card">
        <summary className="cursor-pointer p-4 list-none">
          <h2 className="heading-4 text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Table View (Click to Expand)
          </h2>
        </summary>
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {typedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                  <td className="px-4 py-3 font-mono text-sm font-medium">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customers?.[0]?.contact_name || order.customers?.[0]?.company_name || order.customers?.[0]?.email}</p>
                    <p className="text-sm text-gray-500">{order.customers?.[0]?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.order_items?.length || 0} items
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatPrice(order.total_usd || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_CONFIG[order.status]?.className || 'badge-gray'}`}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/admin/orders/${order.id}`} className="btn-ghost btn-sm text-primary hover:text-primary-dark">
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}