import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCollections, getBrands } from '@/lib/data/products';
import { toTermKey } from '@/lib/i18n/localize';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';

export const revalidate = 3600; // ISR: revalidate every hour

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collection' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/collections'),
  };
}

export default async function CollectionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tCommon, tMaterials, allCollections, allBrands] = await Promise.all([
    getTranslations({ locale, namespace: 'collection' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'materials' }),
    getCollections(locale),
    getBrands(locale),
  ]);

  const activeCollections = allCollections.filter((c) => c.is_active);
  const activeBrands = allBrands.filter((b) =>
    activeCollections.some((c) => c.brand_id === b.id)
  );

  const brands = activeBrands
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description || t('brand_fallback_desc', { name: brand.name }),
      collections: activeCollections.filter((c) => c.brand_id === brand.id),
    }))
    .filter((b) => b.collections.length > 0);

  const translateFinish = (name: string) => {
    const key = `finishes.${toTermKey(name)}`;
    return tMaterials.has(key) ? tMaterials(key) : name;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Page Header - Calm Editorial Style */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100/50 text-amber-800 text-sm font-medium mb-6 tracking-wide">
              {t('badge')}
            </span>
            <h1 className="heading-1 text-gray-900 mb-4">{t('title')}</h1>
            <p className="body-lg text-gray-600 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Brand Sections - Calm Editorial Style */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {brands.map((brand, brandIndex) => (
            <section key={brand.id} className="mb-20 lg:mb-28 animate-slide-up" style={{ animationDelay: `${brandIndex * 150}ms` }}>
              {/* Brand Header */}
              <div className="mb-10 lg:mb-12">
                <h2 className="heading-2 text-gray-900 mb-3">{brand.name}</h2>
                <p className="body-lg text-gray-600 max-w-2xl">{brand.description}</p>
              </div>

              {/* Collections Grid - Calm Editorial Card Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {brand.collections.map((collection, collectionIndex) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.slug}`}
                    className="collection-card group animate-slide-up"
                    style={{ animationDelay: `${collectionIndex * 100}ms` }}
                    aria-label={t('view_collection_aria', { name: collection.name })}
                  >
                    {/* Hero Image */}
                    <div className="collection-card-image relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={collection.hero_image_url || '/hero-furniture.jpg'}
                        alt={t('hero_alt', { name: collection.name })}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="collection-card-image object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Content Overlay */}
                      <div className="collection-overlay">
                        <span className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                          {t('explore', { name: collection.name })}
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <span className="inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full mb-3">
                        {brand.name}
                      </span>

                      <h3 className="heading-3 text-gray-900 mb-2">{collection.name}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{collection.description}</p>

                      {collection.color_palette && collection.color_palette.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {collection.color_palette.slice(0, 4).map((color, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-gray-900 border border-gray-200"
                              style={{ backgroundColor: color.hex + '33', borderColor: color.hex }}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-white/50"
                                style={{ backgroundColor: color.hex }}
                              />
                              {translateFinish(color.name)}
                            </span>
                          ))}
                          {collection.color_palette.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              {t('more_colors', { count: collection.color_palette.length - 4 })}
                            </span>
                          )}
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1 font-medium self-start text-amber-700 hover:text-amber-900 transition-colors">
                        {t('view_collection')}
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* CTA Section - Calm Editorial Style */}
      <section className="py-16 lg:py-20 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-4">{t('cta_title')}</h2>
          <p className="body-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
            {t('cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn btn-primary btn-lg bg-amber-600 hover:bg-amber-500 text-white w-full sm:w-auto">
              {t('browse_all_products')}
            </Link>
            <Link href="/contact" className="btn btn-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm transition-all w-full sm:w-auto">
              {tCommon('contact_us')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
