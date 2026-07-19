import { createServiceClient } from '@/lib/db/client';

interface SiteSettings {
  show_pricing: boolean;
  show_stock: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  seo_defaults: {
    site_title: string;
    site_description: string;
    og_image: string;
  };
  default_currency: string;
  supported_currencies: string[];
}

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

  const getBool = (key: string, defaultVal: boolean): boolean => {
    const val = s[key];
    return typeof val === 'boolean' ? val : defaultVal;
  };

  const getString = (key: string, defaultVal: string): string => {
    const val = s[key];
    return typeof val === 'string' ? val : defaultVal;
  };

  const getStringArray = (key: string, defaultVal: string[]): string[] => {
    const val = s[key];
    return Array.isArray(val) ? val.map(String) : defaultVal;
  };

  return {
    show_pricing: getBool('show_pricing', true),
    show_stock: getBool('show_stock', true),
    maintenance_mode: getBool('maintenance_mode', false),
    maintenance_message: getString('maintenance_message', 'We are performing scheduled maintenance. Please check back soon.'),
    seo_defaults: {
      site_title: getString('site_title', 'Lotten'),
      site_description: getString('site_description', 'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.'),
      og_image: getString('og_image', '/og-default.jpg'),
    },
    default_currency: getString('default_currency', 'MYR'),
    supported_currencies: getStringArray('supported_currencies', ['MYR']),
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
      og_image: '/og-default.jpg',
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

export async function isMaintenanceMode(): Promise<{ enabled: boolean; message: string }> {
  const settings = await getSiteSettings();
  return {
    enabled: settings.maintenance_mode,
    message: settings.maintenance_message,
  };
}

export async function getSeoDefaults(): Promise<SiteSettings['seo_defaults']> {
  const settings = await getSiteSettings();
  return settings.seo_defaults;
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