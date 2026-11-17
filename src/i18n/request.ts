import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './routing';

export { locales, defaultLocale, type Locale };

type MessagesRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is MessagesRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge fallback messages (English) with target locale messages so a
 * missing nested key never throws MISSING_MESSAGE at runtime.
 */
function deepMergeMessages(base: MessagesRecord, override: MessagesRecord): MessagesRecord {
  const result: MessagesRecord = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMergeMessages(result[key] as MessagesRecord, value);
    } else if (value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const enModule = await import('../messages/en.json');
  const enMessages = enModule.default as MessagesRecord;

  if (locale === defaultLocale) {
    return {
      locale,
      messages: enMessages,
    };
  }

  let localeMessages: MessagesRecord = {};
  try {
    const mod = await import(`../messages/${locale}.json`);
    localeMessages = mod.default as MessagesRecord;
  } catch {
    console.warn(`Messages for "${locale}" not found, falling back to en`);
  }

  return {
    locale,
    messages: deepMergeMessages(enMessages, localeMessages),
  };
});
