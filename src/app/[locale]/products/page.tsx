import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getAllActiveProducts, formatPrice, getCollections } from '@/lib/data/products';
import { CANONICAL_CATEGORIES } from '@/lib/constants/categories';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import ProductsPageClient from './ProductsPageClient';
import { ProductFilters } from './ProductFilters';

export const revalidate = 3600; // ISR: revalidate every hour

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    collection?: string;
    category?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'product' });
  return {
    title: t('products_page_title'),
    description: t('products_page_meta_desc'),
    alternates: buildLocaleAlternates(locale, '/products'),
  };
}

export default async function ProductsPage({ params: routeParams, searchParams }: Props) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  setRequestLocale(locale);

  const page = parseInt(params.page || '1');
  const collectionFilter = params.collection || '';
  const categoryFilter = params.category || '';
  const sortFilter = params.sort || 'featured';
  const perPage = 12;

  const [t, tCommon, productsData, allCollections] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'common' }),
    getAllActiveProducts(locale),
    getCollections(locale),
  ]);

  const matchedCollection = collectionFilter
    ? allCollections.find((c) => c.id === collectionFilter || c.slug === collectionFilter) || null
    : null;

  let products = productsData;

  // Filter by collection (supports either collection UUID or slug)
  if (collectionFilter) {
    const targetId = matchedCollection ? matchedCollection.id : collectionFilter;
    products = products.filter((p) => p.collection_id === targetId);
  }

  // Filter by category (new, bestseller, or specific category tag)
  if (categoryFilter === 'new') {
    products = products.filter((p) => p.is_new);
  } else if (categoryFilter === 'bestseller') {
    products = products.filter((p) => p.is_bestseller);
  } else if (categoryFilter) {
    const target = categoryFilter.toLowerCase();
    const categoryConfig = CANONICAL_CATEGORIES.find(
      (c) => c.name.toLowerCase() === target || c.slug.toLowerCase() === target
    );
    const searchTerms = [
      target,
      ...(categoryConfig?.aliases?.map((a) => a.toLowerCase()) || []),
    ];

    products = products.filter((p) => {
      const inCategories = p.categories?.some((c) =>
        searchTerms.some((term) => c.toLowerCase() === term || c.toLowerCase().includes(term))
      );
      if (inCategories) return true;

      const nameLower = p.name.toLowerCase();
      return searchTerms.some((term) => nameLower.includes(term));
    });
  }

  // Sort products
  switch (sortFilter) {
    case 'price-asc':
      products.sort((a, b) => a.price_usd - b.price_usd);
      break;
    case 'price-desc':
      products.sort((a, b) => b.price_usd - a.price_usd);
      break;
    case 'newest':
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'name-asc':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      products.sort((a, b) => {
        const aScore = (a.is_new ? 2 : 0) + (a.is_bestseller ? 1 : 0);
        const bScore = (b.is_new ? 2 : 0) + (b.is_bestseller ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.sort_order - b.sort_order;
      });
      break;
  }

  const totalPages = Math.ceil(products.length / perPage);
  const paginatedProducts = products.slice((page - 1) * perPage, page * perPage);

  const activeCollectionIds = new Set(productsData.map((p) => p.collection_id).filter(Boolean));
  const filterCollections = allCollections
    .filter((c) => c.is_active && activeCollectionIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  function getCollectionName(collectionId: string): string {
    const found = allCollections.find((c) => c.id === collectionId);
    return found?.name || t('collection_fallback');
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="py-16 bg-stone-100/50 border-b border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="heading-1 text-stone-900 mb-4">{t('products_page_title')}</h1>
            <p className="body-lg text-stone-600">{t('products_page_subtitle')}</p>
            {matchedCollection && (
              <p className="body text-amber-800 mt-4 font-medium">
                {t('showing_in_collection', {
                  count: products.length,
                  collection: matchedCollection.name,
                })}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filters & Toolbar */}
      <section className="py-8 border-b border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductFilters
            collectionFilter={matchedCollection ? matchedCollection.id : collectionFilter}
            categoryFilter={categoryFilter}
            sortFilter={sortFilter}
            collections={filterCollections}
          />
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-800">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="heading-3 text-stone-900 mt-2">{t('no_products_found')}</h2>
              <p className="body text-stone-600 mt-2">
                {categoryFilter || collectionFilter
                  ? t('no_products_filtered')
                  : t('no_products_default')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {(categoryFilter || collectionFilter) && (
                  <Link href="/products" className="btn btn-primary px-5 py-2.5 rounded-lg shadow-xs hover:shadow transition-all">
                    {t('clear_filters')}
                  </Link>
                )}
                <Link href="/products" className="btn btn-outline px-5 py-2.5 rounded-lg border-stone-200 hover:bg-stone-50 transition-colors">
                  {t('view_all_products')}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list">
                {paginatedProducts.map((product) => {
                  const primaryImage =
                    product.product_images?.find((img) => img.is_primary) ||
                    product.product_images?.[0];

                  return (
                    <article
                      key={product.id}
                      className="product-card group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                      role="listitem"
                    >
                      <Link
                        href={`/products/${product.slug}`}
                        className="block"
                        aria-label={t('view_product_aria', { name: product.name })}
                      >
                        {/* Product Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt_text || product.name}
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
                          <div className="absolute top-3 left-3 right-3 flex justify-between">
                            {product.is_new && (
                              <span className="badge-primary badge-success text-xs px-2 py-1">
                                {t('new_badge')}
                              </span>
                            )}
                            {product.is_bestseller && (
                              <span className="badge-primary text-xs px-2 py-1">
                                {t('bestseller')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <p className="caption text-amber-800 font-medium mb-1">
                            {getCollectionName(product.collection_id)}
                          </p>
                          <h3 className="product-card-title font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="product-card-price text-lg font-bold text-stone-900 tabular-nums">
                            {formatPrice(product.price_usd, locale, t('contact_for_price'))}
                          </p>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <p className="text-sm text-stone-600">
                    {t('showing_range', {
                      start: (page - 1) * perPage + 1,
                      end: Math.min(page * perPage, products.length),
                      total: products.length,
                    })}
                  </p>
                  <nav className="flex items-center gap-2" aria-label={tCommon('pagination_aria')}>
                    {page > 1 && (
                      <Link
                        href={`/products?page=${page - 1}${collectionFilter ? `&collection=${collectionFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}${sortFilter !== 'featured' ? `&sort=${sortFilter}` : ''}`}
                        className="btn btn-outline btn-sm"
                        aria-label={tCommon('previous_page')}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {tCommon('previous')}
                      </Link>
                    )}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Link
                            key={pageNum}
                            href={`/products?page=${pageNum}${collectionFilter ? `&collection=${collectionFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}${sortFilter !== 'featured' ? `&sort=${sortFilter}` : ''}`}
                            className={cn(
                              'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                              page === pageNum
                                ? 'bg-amber-900 text-white shadow-xs'
                                : 'text-stone-600 hover:bg-stone-100'
                            )}
                            aria-label={tCommon('page_number', { page: pageNum })}
                            aria-current={page === pageNum ? 'page' : undefined}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>
                    {page < totalPages && (
                      <Link
                        href={`/products?page=${page + 1}${collectionFilter ? `&collection=${collectionFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}${sortFilter !== 'featured' ? `&sort=${sortFilter}` : ''}`}
                        className="btn btn-outline btn-sm"
                        aria-label={tCommon('next_page')}
                      >
                        {tCommon('next')}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 text-stone-900 mb-4">{t('cta_title')}</h2>
          <p className="body-lg text-stone-600 mb-8 max-w-2xl mx-auto">
            {t('cta_subtitle')}
          </p>
          <Link href="/contact" className="btn btn-primary btn-lg">
            {tCommon('contact_us')}
          </Link>
        </div>
      </section>

      {/* Recently Viewed */}
      <ProductsPageClient />
    </main>
  );
}
