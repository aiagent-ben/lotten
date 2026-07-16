import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/db/client';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Products | Lotten Admin',
};

interface Props {
  searchParams: Promise<{ page?: string; search?: string; collection?: string; status?: string }>;
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
}

interface ImageData {
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface ProductData {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  price_usd: number;
  stock_available: number;
  stock_reserved: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  collections: CollectionData | null;
  images: ImageData[];
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const collectionFilter = params.collection || '';
  const statusFilter = params.status || '';
  const perPage = 20;
  
  const supabase = createServiceClient();
  
  let query = supabase
    .from('products')
    .select(`
      id,
      article_no,
      name,
      slug,
      price_usd,
      stock_available,
      stock_reserved,
      is_active,
      is_new,
      is_bestseller,
      sort_order,
      created_at,
      collections:collection_id (id, name, slug),
      images:product_images!product_id (url, is_primary, sort_order)
    `, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
    
  if (search) {
    query = query.or(`name.ilike.%${search}%,article_no.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  
  if (collectionFilter) {
    query = query.eq('collection_id', collectionFilter);
  }
  
  if (statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  } else if (statusFilter === 'new') {
    query = query.eq('is_new', true);
  } else if (statusFilter === 'bestseller') {
    query = query.eq('is_bestseller', true);
  } else if (statusFilter === 'low_stock') {
    query = query.lte('stock_available', 5);
  } else if (statusFilter === 'out_of_stock') {
    query = query.eq('stock_available', 0);
  }
  
  const { data: products, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
  }
  
  const totalPages = Math.ceil((count ?? 0) / perPage);
  
  // Fetch collections for filter dropdown
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');
  
  const typedProducts = (products || []).map(p => {
    const coll = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    return {
      ...p,
      collections: coll ? { id: coll.id, name: coll.name, slug: coll.slug } : null,
      images: p.images?.map(i => ({ url: i.url, is_primary: i.is_primary, sort_order: i.sort_order })) || [],
    };
  }) as ProductData[];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Products</h1>
          <p className="body text-gray-600 mt-1">Manage your furniture catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <form className="flex flex-col sm:flex-row gap-4" method="GET">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="search"
                value={search}
                placeholder="Search by name, article no, or slug..."
                className="input pl-10"
              />
            </div>
            
            <select name="collection" className="input w-full sm:w-48" defaultValue={collectionFilter}>
              <option value="">All Collections</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <select name="status" className="input w-full sm:w-48" defaultValue={statusFilter}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New Arrivals</option>
              <option value="bestseller">Bestsellers</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            
            {(search || collectionFilter || statusFilter) && (
              <a href="/admin/products" className="btn-outline btn-sm self-end">
                Clear Filters
              </a>
            )}
          </form>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input type="checkbox" id="select-all" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th>Product</th>
                <th className="hidden md:table-cell">Collection</th>
                <th className="text-right">Price</th>
                <th className="text-center hidden lg:table-cell">Stock</th>
                <th className="text-center">Status</th>
                <th className="w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {typedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="mt-2">No products found</p>
                    <p className="text-sm">Try adjusting your filters or <Link href="/admin/products/new" className="text-primary hover:underline">create a new product</Link></p>
                  </td>
                </tr>
              ) : (
                typedProducts.map((product) => {
                  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
                  const netStock = product.stock_available - product.stock_reserved;
                  const stockStatus = netStock <= 0 ? 'out_of_stock' : netStock <= 5 ? 'low' : 'in_stock';
                  
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <input type="checkbox" value={product.id} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <img 
                              src={primaryImage.url} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-gray-500 font-mono">#{product.article_no}</p>
                            <p className="text-xs text-gray-400 font-mono">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className="text-sm text-gray-700">{product.collections?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatPrice(product.price_usd)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={
                          stockStatus === 'out_of_stock' ? 'badge-destructive' :
                          stockStatus === 'low' ? 'badge-warning' : 'badge-success'
                        }>
                          {product.stock_available} ({netStock} avail)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={
                            !product.is_active ? 'badge-destructive' :
                            'badge-success'
                          }>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {product.is_new && <span className="badge-info badge-xs">New</span>}
                          {product.is_bestseller && <span className="badge-primary badge-xs">Best</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link 
                            href={`/admin/products/${product.id}/edit`}
                            className="btn-ghost btn-xs p-2 text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link 
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="btn-ghost btn-xs p-2 text-gray-600 hover:text-gray-900"
                            title="View on site"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {(count ?? 0) > perPage && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, count ?? 0)} of {count ?? 0} products
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <a href={`/admin/products?page=${page - 1}${search ? `&search=${search}` : ''}${collectionFilter ? `&collection=${collectionFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`} className="btn-outline btn-sm">
                  Previous
                </a>
              )}
              <span className="px-3 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a href={`/admin/products?page=${page + 1}${search ? `&search=${search}` : ''}${collectionFilter ? `&collection=${collectionFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`} className="btn-outline btn-sm">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}