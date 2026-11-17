import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCollections } from '@/lib/data/products';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import SearchPageClient from './SearchPageClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'search' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/search'),
  };
}

export default async function SearchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, collections] = await Promise.all([
    getTranslations({ locale, namespace: 'search' }),
    getCollections(locale),
  ]);

  const collectionMap: Record<string, string> = {};
  for (const c of collections) {
    collectionMap[c.id] = c.name;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">{t('loading')}</div>
        </div>
      }
    >
      <SearchPageClient collectionNames={collectionMap} />
    </Suspense>
  );
}
