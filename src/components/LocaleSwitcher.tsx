"use client";

import { useRouter, usePathname } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/request';

const localeLabels: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  my: { label: 'Bahasa', flag: '🇲🇾' },
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (locale: string) => {
    // Extract the path without locale prefix
    const segments = pathname.split('/').filter(Boolean);
    if (['en', 'zh', 'my'].includes(segments[0])) {
      segments.shift(); // Remove current locale
    }
    const newPath = `/${locale}/${segments.join('/')}` || `/${locale}`;
    router.push(newPath);
    router.refresh();
  };

  // Detect current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'en';

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Select language"
      >
        <span className="text-lg">{localeLabels[currentLocale]?.flag || '🌐'}</span>
        <span className="hidden sm:inline">{localeLabels[currentLocale]?.label || currentLocale.toUpperCase()}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              locale === pathname.split('/')[1] ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{localeLabels[locale]?.flag}</span>
            {localeLabels[locale]?.label}
          </button>
        ))}
      </div>
    </div>
  );
}