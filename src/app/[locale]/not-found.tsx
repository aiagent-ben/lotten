"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function LocaleNotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-5xl font-bold text-amber-900 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-stone-900 mb-3">
          {t('not_found_title')}
        </h1>
        <p className="text-stone-600 mb-6">
          {t('not_found_desc')}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
        >
          {t('return_home')}
        </Link>
      </div>
    </div>
  );
}
