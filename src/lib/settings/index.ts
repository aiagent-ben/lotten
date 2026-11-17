import { createServiceClient } from '@/lib/db/client';
import type { SiteSettings, TranslationLocaleKey } from '@/lib/types/database';

type SettingsValue = boolean | string | string[] | Record<string, unknown> | undefined;

let cachedSettings: SiteSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

async function fetchSettings(): Promise<SiteSettings> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('id', 1)
    .single();

  if (!data?.settings) {
    return getDefaults();
  }

  const s = data.settings as Record<string, SettingsValue>;
  const seoDefaults = (s.seo_defaults as Record<string, SettingsValue>) ?? {};
  const translations = s.translations as SiteSettings['translations'];

  const getBool = (key: string, defaultVal: boolean): boolean => {
    const val = s[key];
    return typeof val === 'boolean' ? val : defaultVal;
  };

  const getString = (obj: Record<string, SettingsValue>, key: string, defaultVal: string): string => {
    const val = obj[key];
    return typeof val === 'string' && val.trim().length > 0 ? val : defaultVal;
  };

  const getStringArray = (key: string, defaultVal: string[]): string[] => {
    const val = s[key];
    return Array.isArray(val) ? val.map(String) : defaultVal;
  };

  return {
    show_pricing: getBool('show_pricing', true),
    show_stock: getBool('show_stock', true),
    maintenance_mode: getBool('maintenance_mode', false),
    maintenance_message: getString(s, 'maintenance_message', 'We are performing scheduled maintenance. Please check back soon.'),
    seo_defaults: {
      site_title: getString(seoDefaults, 'site_title', getString(s, 'site_name', 'Lotten')),
      site_description: getString(
        seoDefaults,
        'site_description',
        'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.'
      ),
      og_image: getString(seoDefaults, 'og_image', '/hero-furniture.jpg'),
    },
    default_currency: getString(s, 'default_currency', 'MYR'),
    supported_currencies: getStringArray('supported_currencies', ['MYR']),
    translations,
  };
}

function getDefaults(): SiteSettings {
  return {
    show_pricing: true,
    show_stock: true,
    maintenance_mode: false,
    maintenance_message: 'We are performing scheduled maintenance. Please check back soon.',
    seo_defaults: {
      site_title: 'Lotten',
      site_description: 'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.',
      og_image: '/hero-furniture.jpg',
    },
    default_currency: 'MYR',
    supported_currencies: ['MYR'],
  };
}

export async function getSiteSettings(forceRefresh = false): Promise<SiteSettings> {
  const now = Date.now();
  if (!cachedSettings || forceRefresh || now - cacheTimestamp > CACHE_TTL) {
    cachedSettings = await fetchSettings();
    cacheTimestamp = now;
  }
  return cachedSettings;
}

export async function isPricingVisible(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.show_pricing;
}

export async function isStockVisible(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.show_stock;
}

export async function isMaintenanceMode(locale = 'en'): Promise<{ enabled: boolean; message: string }> {
  const settings = await getSiteSettings();
  const translated =
    locale !== 'en'
      ? settings.translations?.[locale as TranslationLocaleKey]?.maintenance_message
      : undefined;
  return {
    enabled: settings.maintenance_mode,
    message: translated && translated.trim() ? translated : settings.maintenance_message,
  };
}

export async function getSeoDefaults(locale = 'en'): Promise<SiteSettings['seo_defaults']> {
  const settings = await getSiteSettings();
  const translatedSeo =
    locale !== 'en' ? settings.translations?.[locale as TranslationLocaleKey]?.seo_defaults : undefined;
  return {
    site_title: translatedSeo?.site_title?.trim() || settings.seo_defaults.site_title,
    site_description: translatedSeo?.site_description?.trim() || settings.seo_defaults.site_description,
    og_image: settings.seo_defaults.og_image,
  };
}

export async function getCurrencySettings(): Promise<{ default: string; supported: string[] }> {
  const settings = await getSiteSettings();
  return {
    default: settings.default_currency,
    supported: settings.supported_currencies,
  };
}

export function clearSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
