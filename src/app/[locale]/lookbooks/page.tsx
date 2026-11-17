import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getContentList } from '@/lib/data/content';
import { toTermKey } from '@/lib/i18n/localize';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { ChevronRight, MapPin, Image as ImageIcon, ShoppingBag } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    room?: string;
    style?: string;
    search?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'lookbook' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/lookbooks'),
  };
}

const styleTagKeys = [
  'modern',
  'scandinavian',
  'industrial',
  'mid-century',
  'minimalist',
  'rustic',
  'coastal',
  'bohemian',
] as const;

export default async function LookbooksPage({ params: routeParams, searchParams }: PageProps) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  setRequestLocale(locale);

  const page = parseInt(params.page || '1');
  const room = params.room;
  const style = params.style;
  const search = params.search;

  const [t, tCommon, contentResult] = await Promise.all([
    getTranslations({ locale, namespace: 'lookbook' }),
    getTranslations({ locale, namespace: 'common' }),
    getContentList({
      type: 'lookbook',
      status: 'published',
      page,
      perPage: 12,
      room_type: room,
      style: style,
      search: search,
      locale,
    }),
  ]);

  const { data: lookbooks, totalPages } = contentResult;

  const roomTypes = [
    { slug: 'living-room', name: t('room_living_room'), icon: '🛋️' },
    { slug: 'bedroom', name: t('room_bedroom'), icon: '🛏️' },
    { slug: 'dining-room', name: t('room_dining_room'), icon: '🍽️' },
    { slug: 'office', name: t('room_office'), icon: '💻' },
    { slug: 'outdoor', name: t('room_outdoor'), icon: '🌿' },
  ];

  const translateRoom = (roomType: string) => {
    const key = `room_${toTermKey(roomType)}`;
    return t.has(key) ? t(key) : roomType.replace('-', ' ');
  };

  const translateStyle = (tag: string) => {
    const key = `style_${toTermKey(tag)}`;
    return t.has(key) ? t(key) : tag;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-medium mb-4">
          <ImageIcon className="w-3.5 h-3.5" />
          {t('badge')}
        </div>
        <h1 className="text-4xl lg:text-5xl font-serif font-medium text-stone-900 mb-4 tracking-tight">
          {t('title')}
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl leading-relaxed">{t('subtitle')}</p>
      </header>

      {/* Filter Bar */}
      <div className="mb-10 space-y-4 p-5 rounded-2xl bg-stone-50 border border-stone-200/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">
            {t('room_label')}
          </span>
          <Link
            href={`/lookbooks${style ? `?style=${encodeURIComponent(style)}` : ''}`}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              !room
                ? 'bg-stone-900 text-stone-50 shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t('all_rooms')}
          </Link>
          {roomTypes.map((roomType) => {
            const isActive = room === roomType.slug;
            return (
              <Link
                key={roomType.slug}
                href={`/lookbooks?room=${encodeURIComponent(roomType.slug)}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>{roomType.icon}</span>
                <span>{roomType.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">
            {t('style_label')}
          </span>
          <Link
            href={`/lookbooks${room ? `?room=${encodeURIComponent(room)}` : ''}`}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              !style
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t('all_styles')}
          </Link>
          {styleTagKeys.map((styleTag) => {
            const isActive = style === styleTag;
            return (
              <Link
                key={styleTag}
                href={`/lookbooks?style=${encodeURIComponent(styleTag)}${room ? `&room=${encodeURIComponent(room)}` : ''}`}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {translateStyle(styleTag)}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        {lookbooks.length === 0 ? (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200/80">
            <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-900 mb-2">{t('no_lookbooks')}</h3>
            <p className="text-stone-600 mb-4">{t('no_lookbooks_desc')}</p>
            <Link href="/lookbooks" className="btn btn-secondary btn-sm inline-flex">
              {tCommon('reset_filters')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
              {lookbooks.map((lookbook) => (
                <article key={lookbook.id} className="card group overflow-hidden border border-stone-200 hover:border-amber-700/40 hover:shadow-lg transition-all duration-300">
                  <Link href={`/lookbooks/${lookbook.slug}`} className="block">
                    <figure className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                      {lookbook.featured_image_url ? (
                        <Image
                          src={lookbook.featured_image_url}
                          alt={lookbook.featured_image_alt || lookbook.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-stone-400" />
                        </div>
                      )}
                      {lookbook.room_type && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 text-xs font-medium bg-stone-900/80 text-stone-100 rounded-full backdrop-blur-sm capitalize flex items-center gap-1.5 shadow-sm">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            {translateRoom(lookbook.room_type)}
                          </span>
                        </div>
                      )}
                    </figure>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {lookbook.style_tags.map((tagItem) => (
                          <span key={tagItem} className="px-2.5 py-0.5 text-xs bg-amber-50 text-amber-800 border border-amber-200/50 rounded-full capitalize">
                            {translateStyle(tagItem)}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-2xl font-serif font-medium text-stone-900 group-hover:text-amber-800 transition-colors mb-2">
                        {lookbook.title}
                      </h3>
                      {lookbook.excerpt && (
                        <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed mb-4">
                          {lookbook.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between text-sm">
                    <span className="text-stone-500 font-medium flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-700" />
                      {t('featured_pieces', { count: lookbook.featured_products?.length || 0 })}
                    </span>
                    <Link
                      href={`/lookbooks/${lookbook.slug}`}
                      className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-medium text-sm transition-colors"
                    >
                      {t('shop_the_look')}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2" aria-label={tCommon('pagination_aria')}>
                {page > 1 && (
                  <Link
                    href={`/lookbooks?page=${page - 1}${room ? `&room=${encodeURIComponent(room)}` : ''}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                    className="btn btn-outline btn-sm"
                  >
                    {tCommon('previous')}
                  </Link>
                )}
                <span className="px-4 text-sm text-stone-600 tabular-nums">
                  {tCommon('page_of', { page, total: totalPages })}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/lookbooks?page=${page + 1}${room ? `&room=${encodeURIComponent(room)}` : ''}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                    className="btn btn-outline btn-sm"
                  >
                    {tCommon('next')}
                  </Link>
                )}
              </nav>
            )}

            {/* CTA */}
            <div className="text-center py-12 bg-amber-50/60 border border-amber-200 rounded-2xl mt-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">{t('cta_title')}</h2>
              <p className="text-stone-600 mb-6 max-w-xl mx-auto">{t('cta_subtitle')}</p>
              <Link href="/contact" className="btn btn-primary inline-flex">
                {t('book_consultation')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
