import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/about'),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'about' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          {tCommon('back_to_home')}
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-6">
          {t('title')}
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">{t('p1')}</p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">{t('p2')}</p>
        <p className="text-lg text-gray-700 leading-relaxed mb-12">{t('p3')}</p>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            {t('what_we_make')}
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>{t('item_1_strong')}</strong> {t('item_1_text')}
            </li>
            <li>
              <strong>{t('item_2_strong')}</strong> {t('item_2_text')}
            </li>
            <li>
              <strong>{t('item_3_strong')}</strong> {t('item_3_text')}
            </li>
            <li>
              <strong>{t('item_4_strong')}</strong> {t('item_4_text')}
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-100 pt-12 mt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            {t('promise_title')}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('promise_prefix')}{' '}
            <Link
              href="/contact"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              {t('promise_link')}
            </Link>{' '}
            {t('promise_suffix')}
          </p>
        </section>
      </article>
    </main>
  );
}
