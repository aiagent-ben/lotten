"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_usd: number;
  collection_id: string;
  collection_name: string;
  brand_name: string;
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
  }[];
  primary_image_url: string | null;
  is_new: boolean;
  is_bestseller: boolean;
  stock_available: number;
}

interface SearchResults {
  hits: Product[];
  estimatedTotalHits: number;
  facets: any;
  processingTimeMs: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchFilters {
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minDepth?: number;
  maxDepth?: number;
  minHeight?: number;
  maxHeight?: number;
  inStock?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  sortBy?: string;
  page: number;
  limit: number;
}

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 20,
  });

  // Initialize filters from URL params
  useEffect(() => {
    const newFilters: SearchFilters = { page: 1, limit: 20 };
    const newQuery = searchParams.get('q') || '';
    
    searchParams.forEach((value, key) => {
      if (key === 'q') return;
      if (key === 'page') {
        newFilters.page = parseInt(value);
      } else if (key === 'limit') {
        newFilters.limit = parseInt(value);
      } else if (key in newFilters) {
        (newFilters as any)[key] = value === 'true' ? true : value;
      }
    });
    
    setQuery(newQuery);
    setFilters(newFilters);
  }, [searchParams]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Perform search when filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) {
        params.set(k, String(v));
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const newFilters: SearchFilters = { page: 1, limit: 20 };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (['page', 'limit'].includes(key)) return false;
    return value !== undefined && value !== '' && value !== false;
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Search Header */}
      <section className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); updateFilter('page', 1); }}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateFilter('page', 1); }}}
                    placeholder={`Search furniture... (e.g., "tv cabinet", "oak dining table")`}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary btn-lg px-8 whitespace-nowrap"
                  disabled={!query.trim() && !hasActiveFilters}
                >
                  Search
                </button>
              </div>
            </form>

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Filters:</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (['page', 'limit'].includes(key) || !value) return null;
                  return (
                    <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                      <button
                        onClick={() => updateFilter(key as keyof SearchFilters, undefined)}
                        className="ml-1 text-amber-600 hover:text-amber-800"
                        aria-label={`Remove ${key} filter`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="heading-4 text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn-ghost text-sm"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>

                <div className={cn('space-y-6', !showFilters && 'lg:hidden')}>
                  {/* Collection Filter */}
                  <FilterSection title="Collection" icon={<Filter className="w-4 h-4" />}>
                    <div className="space-y-2">
                      {results?.facets.collection_id && Object.entries(results.facets.collection_id as Record<string, number>).map(([collectionId, count]) => (
                        <label key={collectionId} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.collection === collectionId}
                            onChange={(e) => updateFilter('collection', e.target.checked ? collectionId : undefined)}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <span className="text-gray-700">{collectionId}</span>
                          <span className="ml-auto text-xs text-gray-400">({count})</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Price Range */}
                  <FilterSection title="Price Range" icon={<Filter className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input px-3 py-2 text-sm"
                        min="0"
                        step="100"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input px-3 py-2 text-sm"
                        min="0"
                        step="100"
                      />
                    </div>
                  </FilterSection>

                  {/* Dimensions */}
                  <FilterSection title="Dimensions (mm)" icon={<Filter className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Min W" value={filters.minWidth || ''} onChange={(e) => updateFilter('minWidth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                      <input type="number" placeholder="Max W" value={filters.maxWidth || ''} onChange={(e) => updateFilter('maxWidth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                      <input type="number" placeholder="Min D" value={filters.minDepth || ''} onChange={(e) => updateFilter('minDepth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                      <input type="number" placeholder="Max D" value={filters.maxDepth || ''} onChange={(e) => updateFilter('maxDepth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                      <input type="number" placeholder="Min H" value={filters.minHeight || ''} onChange={(e) => updateFilter('minHeight', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                      <input type="number" placeholder="Max H" value={filters.maxHeight || ''} onChange={(e) => updateFilter('maxHeight', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm" />
                    </div>
                  </FilterSection>

                  {/* Quick Filters */}
                  <FilterSection title="Quick Filters" icon={<Filter className="w-4 h-4" />}>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.inStock}
                          onChange={(e) => updateFilter('inStock', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-gray-700">In Stock</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.isNew}
                          onChange={(e) => updateFilter('isNew', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-gray-700">New Arrivals</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.isBestseller}
                          onChange={(e) => updateFilter('isBestseller', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-gray-700">Bestsellers</span>
                      </label>
                    </div>
                  </FilterSection>

                  {/* Sort */}
                  <FilterSection title="Sort By" icon={<Filter className="w-4 h-4" />}>
                    <select
                      value={filters.sortBy || 'sort_order:asc'}
                      onChange={(e) => updateFilter('sortBy', e.target.value)}
                      className="input w-full"
                    >
                      <option value="sort_order:asc">Featured</option>
                      <option value="price_usd:asc">Price: Low to High</option>
                      <option value="price_usd:desc">Price: High to Low</option>
                      <option value="is_new:desc,sort_order:asc">Newest First</option>
                      <option value="is_bestseller:desc,sort_order:asc">Bestsellers First</option>
                      <option value="created_at:desc">Recently Added</option>
                    </select>
                  </FilterSection>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600">
                    {results ? (
                      <>Showing <strong>{(results.page - 1) * results.limit + 1}</strong>–<strong>{Math.min(results.page * results.limit, results.estimatedTotalHits)}</strong> of <strong>{results.estimatedTotalHits}</strong> products</>
                    ) : (
                      'Search for products...'
                    )}
                  </p>
                </div>
              </div>

              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="product-card bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && results && results.hits.length === 0 && (
                <div className="text-center py-16">
                  <Search className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="heading-3 text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                  <button onClick={clearFilters} className="btn-outline">
                    Clear all filters
                  </button>
                </div>
              )}

              {!loading && results && results.hits.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
                    {results.hits.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {results.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateFilter('page', results.page - 1)}
                        disabled={results.page === 1 || loading}
                        className="btn-outline disabled:opacity-50"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm text-gray-600">
                        Page {results.page} of {results.totalPages}
                      </span>
                      <button
                        onClick={() => updateFilter('page', results.page + 1)}
                        disabled={results.page === results.totalPages || loading}
                        className="btn-outline disabled:opacity-50"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer list-none">
        <span className="text-gray-400">{icon}</span>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <ChevronDown className="ml-auto w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 pb-4 border-b border-gray-100">
        {children}
      </div>
    </details>
  );
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

  return (
    <article className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300" role="listitem">
      <Link href={`/products/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              placeholder="blur"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="badge-primary badge-success text-xs px-2 py-1 self-start">New</span>
            )}
            {product.is_bestseller && (
              <span className="badge-primary text-xs px-2 py-1 self-start">Bestseller</span>
            )}
            {product.stock_available > 0 && product.stock_available <= 5 && (
              <span className="badge-warning text-xs px-2 py-1 self-start">Low Stock</span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="caption text-amber-700 font-medium mb-1 uppercase tracking-wider">
            {product.collection_name}
          </p>
          <h3 className="product-card-title font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
          <p className="product-card-price text-lg font-bold text-gray-900">
            {formatPrice(product.price_usd)}
          </p>
        </div>
      </Link>
    </article>
  );
}