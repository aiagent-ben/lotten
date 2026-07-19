"use client";

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export interface ProductData {
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
  collections: { id: string; name: string; slug: string } | null;
  images: { url: string; is_primary: boolean; sort_order: number }[];
}

export interface CollectionData {
  id: string;
  name: string;
  slug: string;
}

interface ProductsClientProps {
  initialProducts: ProductData[];
  initialCount: number;
  initialPage: number;
  initialSearch: string;
  initialCollectionFilter: string;
  initialStatusFilter: string;
  initialPerPage: number;
  initialTotalPages: number;
  initialCollections: CollectionData[];
}

export default function ProductsClient({
  initialProducts,
  initialCount,
  initialPage,
  initialSearch,
  initialCollectionFilter,
  initialStatusFilter,
  initialPerPage,
  initialTotalPages,
  initialCollections,
}: ProductsClientProps) {
  const [products, setProducts] = useState<ProductData[]>(initialProducts);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [collectionFilter, setCollectionFilter] = useState(initialCollectionFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [perPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [collections] = useState<CollectionData[]>(initialCollections);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionId, setNewCollectionId] = useState('');

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
    setSelectAll(selectedIds.length + 1 === products.length);
  };

  const handleBulkAction = useCallback(
    async (action: 'activate' | 'deactivate' | 'delete' | 'change_collection') => {
      if (selectedIds.length === 0) return;

      setBulkActionLoading(true);
      setBulkActionError(null);
      setBulkActionSuccess(null);

      if (action === 'change_collection' && !newCollectionId) {
        setShowCollectionModal(true);
        setBulkActionLoading(false);
        return;
      }

      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds: selectedIds, collectionId: newCollectionId }),
      });

      const result = await response.json();

      if (result.success) {
        const messages: Record<string, string> = {
          activate: `${selectedIds.length} product(s) activated`,
          deactivate: `${selectedIds.length} product(s) deactivated`,
          delete: `${selectedIds.length} product(s) deleted`,
          change_collection: `${selectedIds.length} product(s) moved to new collection`,
        };
        setBulkActionSuccess(messages[action] || 'Action completed');
        setSelectedIds([]);
        setSelectAll(false);
        setNewCollectionId('');
        setShowCollectionModal(false);
        refetchProducts();
      } else {
        setBulkActionError(result.error || 'Action failed');
      }

      setBulkActionLoading(false);
    },
    [selectedIds, newCollectionId]
  );

  const handleExportCSV = useCallback(async () => {
    const response = await fetch('/api/admin/products/export');
    if (response.ok) {
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  }, []);

  const refetchProducts = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (search) params.set('search', search);
    if (collectionFilter) params.set('collection', collectionFilter);
    if (statusFilter) params.set('status', statusFilter);

    const response = await fetch(`/api/admin/products?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setProducts(data.data || []);
      setCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    }
  }, [page, search, collectionFilter, statusFilter, perPage]);

  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
      const params = new URLSearchParams({
        page: newPage.toString(),
        perPage: perPage.toString(),
      });
      if (search) params.set('search', search);
      if (collectionFilter) params.set('collection', collectionFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        setCount(data.count || 0);
      }
    },
    [totalPages, search, collectionFilter, statusFilter, perPage]
  );

  const handleSearch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newSearch = formData.get('search') as string;
      const newCollection = formData.get('collection') as string;
      const newStatus = formData.get('status') as string;

      setSearch(newSearch);
      setCollectionFilter(newCollection);
      setStatusFilter(newStatus);
      setPage(1);

      const params = new URLSearchParams({
        page: '1',
        perPage: perPage.toString(),
      });
      if (newSearch) params.set('search', newSearch);
      if (newCollection) params.set('collection', newCollection);
      if (newStatus) params.set('status', newStatus);

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        setCount(data.count || 0);
        setTotalPages(data.totalPages || 1);
      }
    },
    [perPage]
  );

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

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="card-content flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-amber-800">
                {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                Bulk Actions
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={bulkActionLoading}
                className="btn-outline btn-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkActionLoading}
                className="btn-outline btn-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="btn-outline btn-sm text-destructive border-destructive hover:bg-destructive hover:text-white"
              >
                Delete
              </button>
              <button
                onClick={() => handleBulkAction('change_collection')}
                disabled={bulkActionLoading}
                className="btn-outline btn-sm"
              >
                Change Collection
              </button>
              <button
                onClick={handleExportCSV}
                disabled={bulkActionLoading}
                className="btn-outline btn-sm"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  setSelectedIds([]);
                  setSelectAll(false);
                }}
                className="btn-ghost btn-sm text-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkActionError && (
        <div className="card border-destructive bg-destructive/5">
          <div className="card-content p-4 text-destructive">{bulkActionError}</div>
        </div>
      )}

      {bulkActionSuccess && (
        <div className="card border-success bg-success/5">
          <div className="card-content p-4 text-success">{bulkActionSuccess}</div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, article no, or slug..."
                className="input pl-10"
              />
            </div>

            <select name="collection" value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="input w-full sm:w-48">
              <option value="">All Collections</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select name="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New Arrivals</option>
              <option value="bestseller">Bestsellers</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {(search || collectionFilter || statusFilter) && (
              <button type="submit" className="btn-primary self-end">
                Apply Filters
              </button>
            )}

            <a href="/admin/products" className="btn-outline btn-sm self-end">
              Clear Filters
            </a>
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
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label="Select all products"
                  />
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
              {products.length === 0 ? (
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
                products.map((product) => {
                  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
                  const netStock = product.stock_available - product.stock_reserved;
                  const stockStatus = netStock <= 0 ? 'out_of_stock' : netStock <= 5 ? 'low' : 'in_stock';

                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          value={product.id}
                          checked={selectedIds.includes(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <img src={primaryImage.url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
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
                            !product.is_active ? 'badge-destructive' : 'badge-success'
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
        {count > perPage && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, count)} of {count} products
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => handlePageChange(page - 1)}
                  className="btn-outline btn-sm"
                  disabled={page <= 1}
                >
                  Previous
                </button>
              )}
              <span className="px-3 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="btn-outline btn-sm"
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCollectionModal(false); setNewCollectionId(''); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="heading-4 text-gray-900 mb-4">Move to Collection</h3>
            <p className="text-gray-600 mb-4">Select the collection to move {selectedIds.length} product(s) to:</p>
            <select
              value={newCollectionId}
              onChange={(e) => setNewCollectionId(e.target.value)}
              className="input w-full mb-4"
            >
              <option value="">Select a collection</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowCollectionModal(false); setNewCollectionId(''); }} className="btn-outline">Cancel</button>
              <button onClick={() => handleBulkAction('change_collection')} disabled={bulkActionLoading || !newCollectionId} className="btn-primary">
                {bulkActionLoading ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}