"use client";

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';

const localeLabels: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  my: { label: 'Bahasa', flag: '🇲🇾' },
};

export function LocaleSwitcher() {
  const t = useTranslations('localeSwitcher');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLocaleChange = (locale: string) => {
    setOpen(false);
    const query = searchParams?.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { locale });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[160px] justify-between"
        onClick={() => setOpen(!open)}
        aria-label={t('select_language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-lg flex-shrink-0">{localeLabels[currentLocale]?.flag || '🌐'}</span>
        <span className="hidden sm:inline truncate max-w-[84px]">
          {localeLabels[currentLocale]?.label || currentLocale.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="listbox"
          aria-label={t('select_language')}
        >
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => handleLocaleChange(locale)}
              role="option"
              aria-selected={locale === currentLocale}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === currentLocale
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{localeLabels[locale]?.flag}</span>
              {localeLabels[locale]?.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
