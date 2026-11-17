"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { Select } from '@/components/ui/Select';

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
  images?: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
  }[];
  product_images?: {
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

const NUMERIC_FILTER_KEYS = new Set([
  'minPrice',
  'maxPrice',
  'minWidth',
  'maxWidth',
  'minDepth',
  'maxDepth',
  'minHeight',
  'maxHeight',
]);

const BOOLEAN_FILTER_KEYS = new Set(['inStock', 'isNew', 'isBestseller']);
const STRING_FILTER_KEYS = new Set(['collection', 'sortBy']);

export default function SearchPageClient({
  collectionNames = {},
}: {
  collectionNames?: Record<string, string>;
}) {
  const t = useTranslations('search');
  const tProduct = useTranslations('product');
  const tCommon = useTranslations('common');
  const locale = useLocale();
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

  useEffect(() => {
    const newFilters: SearchFilters = { page: 1, limit: 20 };
    const newQuery = searchParams?.get('q') || '';

    searchParams?.forEach((value, key) => {
      if (key === 'q') return;
      if (key === 'page') {
        newFilters.page = parseInt(value) || 1;
      } else if (key === 'limit') {
        newFilters.limit = parseInt(value) || 20;
      } else if (NUMERIC_FILTER_KEYS.has(key)) {
        const num = Number(value);
        if (!Number.isNaN(num)) (newFilters as any)[key] = num;
      } else if (BOOLEAN_FILTER_KEYS.has(key)) {
        (newFilters as any)[key] = value === 'true';
      } else if (STRING_FILTER_KEYS.has(key)) {
        (newFilters as any)[key] = value;
      }
    });

    setQuery(newQuery);
    setFilters(newFilters);
  }, [searchParams]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('locale', locale);
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
  }, [query, filters, locale]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: key === 'page' ? value : 1 };
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

  const getFilterLabel = (key: string) => {
    return t.has(`filter_labels.${key}`) ? t(`filter_labels.${key}`) : key;
  };

  const formatFilterValue = (key: string, value: unknown) => {
    if (key === 'collection' && typeof value === 'string') {
      return collectionNames[value] || value;
    }
    if (typeof value === 'boolean') return t('in_stock');
    return Array.isArray(value) ? value.join(', ') : String(value);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Search Header */}
      <section className="py-8 bg-stone-100/50 border-b border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); updateFilter('page', 1); }}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateFilter('page', 1); } }}
                    placeholder={t('placeholder')}
                    className="w-full pl-12 pr-4 py-4 text-lg bg-white border-2 border-stone-200 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 shadow-xs"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-8 whitespace-nowrap"
                  disabled={!query.trim() && !hasActiveFilters}
                >
                  {t('button')}
                </button>
              </div>
            </form>

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-stone-500">{t('filters_label')}</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (['page', 'limit'].includes(key) || !value) return null;
                  const label = getFilterLabel(key);
                  return (
                    <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
                      <span className="font-medium">{label}:</span>
                      <span>{formatFilterValue(key, value)}</span>
                      <button
                        onClick={() => updateFilter(key as keyof SearchFilters, undefined)}
                        className="ml-1 text-amber-700 hover:text-amber-900"
                        aria-label={t('remove_filter_aria', { filter: label })}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearFilters}
                  className="text-sm text-stone-500 hover:text-stone-800 underline"
                >
                  {t('clear_all')}
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
                  <h2 className="heading-4 text-stone-900">{t('filters')}</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn btn-ghost btn-sm"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    {showFilters ? t('hide_filters') : t('show_filters')}
                  </button>
                </div>

                <div className={cn('space-y-6', !showFilters && 'hidden lg:block')}>
                  {/* Collection Filter */}
                  <FilterSection title={t('collection')} icon={<Filter className="w-4 h-4" />}>
                    <div className="space-y-2">
                      {results?.facets?.collection_id &&
                        Object.entries(results.facets.collection_id as Record<string, number>).map(
                          ([collectionId, count]) => (
                            <label key={collectionId} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.collection === collectionId}
                                onChange={(e) =>
                                  updateFilter('collection', e.target.checked ? collectionId : undefined)
                                }
                                className="w-4 h-4 text-amber-900 border-stone-300 rounded focus:ring-amber-600/20"
                              />
                              <span className="text-stone-700">
                                {collectionNames[collectionId] || collectionId}
                              </span>
                              <span className="ml-auto text-xs text-stone-400 tabular-nums">({count})</span>
                            </label>
                          )
                        )}
                    </div>
                  </FilterSection>

                  {/* Price Range */}
                  <FilterSection title={t('price_range')} icon={<Filter className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder={t('min')}
                        value={filters.minPrice || ''}
                        onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input px-3 py-2 text-sm border-stone-200"
                        min="0"
                        step="100"
                      />
                      <input
                        type="number"
                        placeholder={t('max')}
                        value={filters.maxPrice || ''}
                        onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input px-3 py-2 text-sm border-stone-200"
                        min="0"
                        step="100"
                      />
                    </div>
                  </FilterSection>

                  {/* Dimensions */}
                  <FilterSection title={t('dimensions_mm')} icon={<Filter className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder={t('min_w')} value={filters.minWidth || ''} onChange={(e) => updateFilter('minWidth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                      <input type="number" placeholder={t('max_w')} value={filters.maxWidth || ''} onChange={(e) => updateFilter('maxWidth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                      <input type="number" placeholder={t('min_d')} value={filters.minDepth || ''} onChange={(e) => updateFilter('minDepth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                      <input type="number" placeholder={t('max_d')} value={filters.maxDepth || ''} onChange={(e) => updateFilter('maxDepth', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                      <input type="number" placeholder={t('min_h')} value={filters.minHeight || ''} onChange={(e) => updateFilter('minHeight', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                      <input type="number" placeholder={t('max_h')} value={filters.maxHeight || ''} onChange={(e) => updateFilter('maxHeight', e.target.value ? parseInt(e.target.value) : undefined)} className="input px-3 py-2 text-sm border-stone-200" />
                    </div>
                  </FilterSection>

                  {/* Quick Filters */}
                  <FilterSection title={t('quick_filters')} icon={<Filter className="w-4 h-4" />}>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(filters.inStock)}
                          onChange={(e) => updateFilter('inStock', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-900 border-stone-300 rounded focus:ring-amber-600/20"
                        />
                        <span className="text-stone-700">{t('in_stock')}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(filters.isNew)}
                          onChange={(e) => updateFilter('isNew', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-900 border-stone-300 rounded focus:ring-amber-600/20"
                        />
                        <span className="text-stone-700">{t('new_arrivals')}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(filters.isBestseller)}
                          onChange={(e) => updateFilter('isBestseller', e.target.checked ? true : undefined)}
                          className="w-4 h-4 text-amber-900 border-stone-300 rounded focus:ring-amber-600/20"
                        />
                        <span className="text-stone-700">{t('bestsellers')}</span>
                      </label>
                    </div>
                  </FilterSection>

                  {/* Sort */}
                  <FilterSection title={t('sort_by')} icon={<Filter className="w-4 h-4" />}>
                    <Select
                      value={filters.sortBy || 'sort_order:asc'}
                      onChange={(e) => updateFilter('sortBy', e.target.value)}
                    >
                      <option value="sort_order:asc">{t('sort_featured')}</option>
                      <option value="price_usd:asc">{t('sort_price_asc')}</option>
                      <option value="price_usd:desc">{t('sort_price_desc')}</option>
                      <option value="is_new:desc,sort_order:asc">{t('sort_newest')}</option>
                      <option value="is_bestseller:desc,sort_order:asc">{t('sort_bestsellers')}</option>
                      <option value="created_at:desc">{t('sort_recent')}</option>
                    </Select>
                  </FilterSection>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-stone-600 tabular-nums">
                    {results
                      ? t('showing_results', {
                          start: results.estimatedTotalHits === 0 ? 0 : (results.page - 1) * results.limit + 1,
                          end: Math.min(results.page * results.limit, results.estimatedTotalHits),
                          total: results.estimatedTotalHits,
                        })
                      : t('prompt')}
                  </p>
                </div>
              </div>

              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="product-card bg-white rounded-xl border border-stone-200 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-stone-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-stone-100 rounded w-3/4" />
                        <div className="h-4 bg-stone-100 rounded w-full" />
                        <div className="h-4 bg-stone-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && results && results.hits.length === 0 && (
                <div className="text-center py-16">
                  <Search className="mx-auto w-16 h-16 text-stone-300 mb-4" />
                  <h3 className="heading-3 text-stone-900 mb-2">{t('no_products')}</h3>
                  <p className="text-stone-500 mb-6">{t('no_products_desc')}</p>
                  <button onClick={clearFilters} className="btn btn-outline">
                    {t('clear_all_filters')}
                  </button>
                </div>
              )}

              {!loading && results && results.hits.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
                    {results.hits.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        t={t}
                        tProduct={tProduct}
                      />
                    ))}
                  </div>

                  {results.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateFilter('page', results.page - 1)}
                        disabled={results.page === 1 || loading}
                        className="btn btn-outline btn-sm disabled:opacity-50"
                        aria-label={tCommon('previous_page')}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm text-stone-600 tabular-nums">
                        {tCommon('page_of', { page: results.page, total: results.totalPages })}
                      </span>
                      <button
                        onClick={() => updateFilter('page', results.page + 1)}
                        disabled={results.page === results.totalPages || loading}
                        className="btn btn-outline btn-sm disabled:opacity-50"
                        aria-label={tCommon('next_page')}
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
        <span className="text-stone-400">{icon}</span>
        <h3 className="font-medium text-stone-900">{title}</h3>
        <ChevronDown className="ml-auto w-4 h-4 text-stone-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 pb-4 border-b border-stone-200">{children}</div>
    </details>
  );
}

function ProductCard({
  product,
  locale,
  t,
  tProduct,
}: {
  product: Product;
  locale: string;
  t: ReturnType<typeof useTranslations<'search'>>;
  tProduct: ReturnType<typeof useTranslations<'product'>>;
}) {
  const imgs = product.product_images || product.images || [];
  const primaryImage = imgs.find((img) => img.is_primary) || imgs[0];
  const imageUrl = primaryImage?.url || product.primary_image_url;

  return (
    <article className="product-card group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow duration-300" role="listitem">
      <Link
        href={`/products/${product.slug}`}
        className="block"
        aria-label={tProduct('view_product_aria', { name: product.name })}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="badge-primary badge-success text-xs px-2.5 py-0.5 self-start">
                {tProduct('new_badge')}
              </span>
            )}
            {product.is_bestseller && (
              <span className="badge-primary text-xs px-2.5 py-0.5 self-start">
                {tProduct('bestseller')}
              </span>
            )}
            {product.stock_available > 0 && product.stock_available <= 5 && (
              <span className="badge-warning text-xs px-2.5 py-0.5 self-start">
                {tProduct('low_stock')}
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="caption text-amber-800 font-medium mb-1 uppercase tracking-wider">
            {product.collection_name}
          </p>
          <h3 className="product-card-title font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="product-card-price text-lg font-bold text-stone-900 tabular-nums">
            {formatPrice(product.price_usd, 'MYR', locale)}
          </p>
        </div>
      </Link>
    </article>
  );
}
