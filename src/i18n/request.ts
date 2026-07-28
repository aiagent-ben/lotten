import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'zh', 'my'] as const;
export const defaultLocale = 'en' as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  let messages;
  try {
    const module = await import(`../messages/${locale}.json`);
    messages = module.default;
  } catch {
    console.warn(`Messages for "${locale}" not found, falling back to en`);
    const module = await import(`../messages/en.json`);
    messages = module.default;
  }

  return {
    locale: locale as string,
    messages,
  };
});