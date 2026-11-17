import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFeaturedProducts } from '@/lib/data/products';
import { getContentList } from '@/lib/data/content';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import NewsletterForm from '@/components/NewsletterForm';
import { getCollectionName } from '@/lib/collections';
import { getDateFnsLocale } from '@/lib/i18n/localize';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { Factory, TreePine, ShieldCheck, BookOpen, ArrowRight, Clock, Calendar } from 'lucide-react';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, ''),
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tCommon, tProduct, tMaterials, featuredProducts, contentResult] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'materials' }),
    getFeaturedProducts(8, locale),
    getContentList({ status: 'published', limit: 3, locale }),
  ]);

  const recentPosts = contentResult.data;
  const dateLocale = getDateFnsLocale(locale);

  return (
    <main className="min-h-screen bg-background font-sans antialiased">
      {/* Hero Section - Calm Editorial Style */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/hero-furniture.jpg)', filter: 'brightness(0.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-900/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-600/20 text-amber-100 text-sm font-medium mb-8 tracking-wide backdrop-blur-sm border border-amber-400/30">
              {t('hero_badge')}
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-6">
              {t('hero_title_line1')}<br />{t('hero_title_line2')}
            </h1>
            <p className="text-lg sm:text-xl text-amber-100/80 mb-10 max-w-2xl leading-relaxed">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="btn btn-primary btn-lg"
              >
                {t('cta_shop')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/collections"
                className="btn btn-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm transition-all"
              >
                {t('cta_collections')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-card border-y border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto gap-8 text-center">
            <div className="py-4">
              <Factory className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-stone-900 mb-1">{t('trust_workshop_title')}</h3>
              <p className="text-sm text-stone-600">{t('trust_workshop_desc')}</p>
            </div>
            <div className="py-4">
              <TreePine className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-stone-900 mb-1">{t('trust_oak_title')}</h3>
              <p className="text-sm text-stone-600">{t('trust_oak_desc')}</p>
            </div>
            <div className="py-4">
              <ShieldCheck className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-stone-900 mb-1">{t('trust_quality_title')}</h3>
              <p className="text-sm text-stone-600">{t('trust_quality_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections - Editorial Style */}
      <section className="py-20 lg:py-28 bg-stone-100/50 border-b border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 mb-4">
              {t('collections_title')}
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              {t('collections_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Breda */}
            <Link href="/collections/breda" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up border border-stone-200">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335048/335048-breda-1-5m-tv-cabinet-109167/0.webp"
                  alt={t('breda_alt')}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors shadow-lg">
                    {t('explore_collection', { name: 'Breda' })}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-amber-900 bg-amber-50 rounded-full mb-3 border border-amber-200">
                  {t('oak_badge')}
                </span>
                <h3 className="font-display text-2xl font-semibold text-stone-900 mb-2">Breda</h3>
                <p className="text-stone-600 mb-4">{t('breda_desc')}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-700">{tMaterials('finishes.walnut')}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-700">{tMaterials('finishes.natural')}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-700">{tMaterials('finishes.white_marble')}</span>
                </div>
                <span className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 transition-colors">
                  {t('view_products_count', { count: 8 })}
                </span>
              </div>
            </Link>

            {/* Dover */}
            <Link href="/collections/dover" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up border border-stone-200">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/134127/134127-dover-coffee-table-109113/0.webp"
                  alt={t('dover_alt')}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors shadow-lg">
                    {t('explore_collection', { name: 'Dover' })}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-amber-900 bg-amber-50 rounded-full mb-3 border border-amber-200">
                  {t('oak_badge')}
                </span>
                <h3 className="font-display text-2xl font-semibold text-stone-900 mb-2">Dover</h3>
                <p className="text-stone-600 mb-4">{t('dover_desc')}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-700">{tMaterials('finishes.walnut')}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-stone-100 text-stone-700">{tMaterials('finishes.natural')}</span>
                </div>
                <span className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 transition-colors">
                  {t('view_products_count', { count: 6 })}
                </span>
              </div>
            </Link>

            {/* Castor */}
            <Link href="/collections/castor" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up border border-stone-200">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335043/335043-castor-1-5m-tv-cabinet-1141021325/0.webp"
                  alt={t('castor_alt')}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors shadow-lg">
                    {t('explore_collection', { name: 'Castor' })}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full mb-3">Luooma</span>
                <h3 className="font-display text-2xl font-semibold text-stone-900 mb-2">Castor</h3>
                <p className="text-stone-600 mb-4">{t('castor_desc')}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">{tMaterials('finishes.black')}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">{tMaterials('finishes.natural')}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">{tMaterials('finishes.space_blue')}</span>
                </div>
                <span className="text-sm font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 transition-colors">
                  {t('view_products_count', { count: 5 })}
                </span>
              </div>
            </Link>
          </div>

          <div className="text-center mt-12 animate-slide-up">
            <Link href="/collections" className="btn btn-outline btn-lg">
              {t('view_all_collections')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 animate-slide-up">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 mb-2">
                {t('featured_products_title')}
              </h2>
              <p className="text-lg text-stone-600">{t('featured_products_subtitle')}</p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 transition-colors"
            >
              {tCommon('view_all')} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {featuredProducts.map((product) => {
              const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
              const collectionLabel =
                product.collection?.name ||
                getCollectionName(product.collection_id, tProduct('collection_fallback'));
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group relative bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  role="listitem"
                  aria-label={tProduct('view_product_aria', { name: product.name })}
                >
                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.is_new && (
                        <span className="px-2.5 py-0.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-full shadow-xs">
                          {t('new_badge')}
                        </span>
                      )}
                      {product.is_bestseller && (
                        <span className="px-2.5 py-0.5 text-xs font-medium text-stone-900 bg-white/90 border border-stone-200 rounded-full shadow-xs backdrop-blur-xs">
                          {t('bestseller_badge')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">
                      {collectionLabel}
                    </p>
                    <h3 className="font-medium text-stone-900 mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-stone-900 tabular-nums">
                        {formatPrice(product.price_usd, 'MYR', locale)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-20 lg:py-28 bg-stone-100/50 border-y border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-600/10 text-amber-800 text-sm font-medium mb-6 border border-amber-200">
                {t('philosophy_badge')}
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 mb-6 leading-tight">
                {t('philosophy_title_line1')}<br />{t('philosophy_title_line2')}
              </h2>
              <div className="space-y-4 text-stone-600">
                <p className="text-lg leading-relaxed">{t('philosophy_p1')}</p>
                <p className="text-lg leading-relaxed">{t('philosophy_p2')}</p>
              </div>
              <Link href="/about" className="btn btn-primary mt-8">
                {t('read_our_story')} <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200">
              <Image
                src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335048/335048-breda-1-5m-tv-cabinet-109167/0.webp"
                alt={t('workshop_alt')}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories & Inspiration */}
      {recentPosts.length > 0 && (
        <section className="py-20 lg:py-28 bg-background border-t border-stone-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 animate-slide-up">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold tracking-wide uppercase mb-3">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('stories_badge')}
                </span>
                <h2 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 mb-2">
                  {t('stories_title')}
                </h2>
                <p className="text-lg text-stone-600 max-w-xl">
                  {t('stories_subtitle')}
                </p>
              </div>
              <Link
                href="/blog"
                className="mt-4 sm:mt-0 text-sm font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1.5 transition-colors group"
              >
                {t('view_all_articles')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => {
                const href = post.type === 'guide'
                  ? `/guides/${post.slug}`
                  : post.type === 'lookbook'
                  ? `/lookbooks/${post.slug}`
                  : post.type === 'page'
                  ? `/${post.slug}`
                  : `/blog/${post.slug}`;

                const typeBadge = post.type === 'guide'
                  ? t('type_guide')
                  : post.type === 'lookbook'
                  ? t('type_lookbook')
                  : post.type === 'page'
                  ? t('type_page')
                  : t('type_article');

                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group flex flex-col bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                      {post.featured_image_url ? (
                        <Image
                          src={post.featured_image_url}
                          alt={post.featured_image_alt || post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50/50">
                          <BookOpen className="w-12 h-12 text-amber-300/80 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 text-stone-800 border border-stone-200 backdrop-blur-sm shadow-xs">
                          {post.category ? post.category.replace(/-/g, ' ') : typeBadge}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(post.published_at), 'MMM d, yyyy', { locale: dateLocale })}
                            </span>
                          )}
                          {post.read_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {t('min_read', { minutes: post.read_time_minutes })}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-xl font-semibold text-stone-900 mb-2.5 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-4">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-stone-100 flex items-center text-sm font-semibold text-amber-800 group-hover:text-amber-900">
                        {t('read_story')}
                        <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-20 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4">{t('newsletter_title')}</h2>
          <p className="text-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">{t('newsletter_subtitle')}</p>
          <NewsletterForm />
          <p className="mt-4 text-sm text-amber-100/60">{t('newsletter_note')}</p>
        </div>
      </section>
    </main>
  );
}
