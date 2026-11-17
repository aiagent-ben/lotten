import type { Metadata } from 'next';
import { locales } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lotten.com';

const hreflangMap: Record<string, string> = {
  en: 'en',
  my: 'ms-MY',
  zh: 'zh-Hans',
};

/**
 * Build per-route canonical and hreflang alternates so subpages never inherit
 * the root layout's canonical URL.
 */
export function buildLocaleAlternates(
  locale: string,
  pathname = ''
): Metadata['alternates'] {
  const cleanPath = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`;
  const languages: Record<string, string> = {};

  for (const loc of locales) {
    const key = hreflangMap[loc] || loc;
    languages[key] = `${SITE_URL}/${loc}${cleanPath}`;
  }
  languages['x-default'] = `${SITE_URL}/en${cleanPath}`;

  return {
    canonical: `${SITE_URL}/${locale}${cleanPath}`,
    languages,
  };
}
