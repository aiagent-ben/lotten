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
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'contact' }),
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
        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          {t('subtitle')}
        </p>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            {t('email_heading')}
          </h2>
          <p className="text-lg text-gray-700">
            <a
              href="mailto:sales@lottenfurniture.com"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              sales@lottenfurniture.com
            </a>
          </p>
          <p className="text-sm text-gray-500 mt-2">{t('email_note')}</p>
        </section>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            {t('workshop_heading')}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('building') && (
              <>
              {(t('building'))}
              <br/>
              </>
            )}
            {t('location')}
            <br />
            {t('visit_note')}
          </p>
        </section>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            {t('hours_heading')}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('hours_days')}
            <br />
            {t('hours_holiday')}
          </p>
        </section>
      </article>
    </main>
  );
}
