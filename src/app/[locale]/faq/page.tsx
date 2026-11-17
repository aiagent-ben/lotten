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
  const t = await getTranslations({ locale, namespace: 'faq' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: buildLocaleAlternates(locale, '/faq'),
  };
}

export default async function FAQPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'faq' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ];

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

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-12">
          {t('title')}
        </h1>

        <div className="space-y-12">
          {faqs.map((faq) => (
            <section key={faq.q} className="border-t border-gray-100 pt-8">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-3">
                {faq.q}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">{faq.a}</p>
            </section>
          ))}
        </div>

        <section className="border-t border-gray-100 pt-12 mt-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('still_question_prefix')}{' '}
            <Link
              href="/contact"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              {t('still_question_link')}
            </Link>{' '}
            {t('still_question_suffix')}
          </p>
        </section>
      </article>
    </main>
  );
}
