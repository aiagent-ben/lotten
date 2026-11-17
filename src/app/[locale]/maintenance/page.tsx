import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isMaintenanceMode } from '@/lib/settings';
import { locales, type Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { Wrench } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'maintenance' });
  return {
    title: t('meta_title'),
    robots: { index: false, follow: false },
  };
}

export default async function MaintenancePage({ params }: PageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, maintenance] = await Promise.all([
    getTranslations({ locale, namespace: 'maintenance' }),
    isMaintenanceMode(locale),
  ]);

  const message =
    locale === 'en' && maintenance.message
      ? maintenance.message
      : maintenance.message && maintenance.message !== 'We are performing scheduled maintenance. Please check back soon.'
      ? maintenance.message
      : t('default_message');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-50">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-stone-200 p-8 sm:p-10 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold uppercase tracking-wide mb-6">
          <Wrench className="w-3.5 h-3.5 text-amber-700" />
          {t('badge')}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-stone-600 leading-relaxed mb-6">{message}</p>
        <p className="text-sm text-stone-500">{t('contact_note')}</p>
      </div>
    </div>
  );
}
