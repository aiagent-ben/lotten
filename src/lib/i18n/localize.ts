import { enUS, ms, zhCN, type Locale as DateFnsLocale } from 'date-fns/locale';
import { CANONICAL_CATEGORIES } from '@/lib/constants/categories';
import type { Brand, Collection, Product } from '@/lib/types/database';
import type { ContentPost } from '@/lib/data/content';

export type SupportedLocale = 'en' | 'my' | 'zh';

const BCP47_MAP: Record<string, string> = {
  en: 'en-MY',
  my: 'ms-MY',
  zh: 'zh-MY',
};

const HTML_LANG_MAP: Record<string, string> = {
  en: 'en',
  my: 'ms',
  zh: 'zh',
};

const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_MY',
  my: 'ms_MY',
  zh: 'zh_MY',
};

const DATE_FNS_LOCALE_MAP: Record<string, DateFnsLocale> = {
  en: enUS,
  my: ms,
  zh: zhCN,
};

export function toBcp47Locale(locale?: string): string {
  if (!locale) return 'en-MY';
  return BCP47_MAP[locale] || (locale.includes('-') ? locale : 'en-MY');
}

export function toHtmlLang(locale?: string): string {
  if (!locale) return 'en';
  return HTML_LANG_MAP[locale] || 'en';
}

export function toOgLocale(locale?: string): string {
  if (!locale) return 'en_MY';
  return OG_LOCALE_MAP[locale] || 'en_MY';
}

export function getDateFnsLocale(locale?: string): DateFnsLocale {
  if (!locale) return enUS;
  return DATE_FNS_LOCALE_MAP[locale] || enUS;
}

function nonEmpty(val: string | null | undefined): string | undefined {
  return typeof val === 'string' && val.trim().length > 0 ? val : undefined;
}

export function localizeBrand<T extends Brand>(brand: T, locale: string): T {
  if (locale === 'en' || !brand.translations) return brand;
  const tr = brand.translations[locale as 'my' | 'zh'];
  if (!tr) return brand;
  return {
    ...brand,
    name: nonEmpty(tr.name) ?? brand.name,
    description: nonEmpty(tr.description) ?? brand.description,
  };
}

export function localizeCollection<T extends Collection>(collection: T, locale: string): T {
  if (locale === 'en' || !collection.translations) return collection;
  const tr = collection.translations[locale as 'my' | 'zh'];
  if (!tr) return collection;
  return {
    ...collection,
    name: nonEmpty(tr.name) ?? collection.name,
    description: nonEmpty(tr.description) ?? collection.description,
    brand: collection.brand ? localizeBrand(collection.brand, locale) : collection.brand,
  };
}

export function localizeProduct<T extends Product>(product: T, locale: string): T {
  const localizedCollection = product.collection
    ? localizeCollection(product.collection, locale)
    : product.collection;

  if (locale === 'en' || !product.translations) {
    return localizedCollection !== product.collection
      ? { ...product, collection: localizedCollection }
      : product;
  }

  const tr = product.translations[locale as 'my' | 'zh'];
  if (!tr) {
    return localizedCollection !== product.collection
      ? { ...product, collection: localizedCollection }
      : product;
  }

  return {
    ...product,
    name: nonEmpty(tr.name) ?? product.name,
    short_description: nonEmpty(tr.short_description) ?? product.short_description,
    description: nonEmpty(tr.description) ?? product.description,
    pack_type: nonEmpty(tr.pack_type) ?? product.pack_type,
    collection: localizedCollection,
  };
}

export function localizeContentPost<T extends ContentPost>(post: T, locale: string): T {
  if (locale === 'en' || !post.translations) return post;
  const tr = post.translations[locale as 'my' | 'zh'];
  if (!tr) return post;

  const localizedHotspots = Array.isArray(post.hotspots)
    ? post.hotspots.map((spot, idx) => {
        const spotTr = tr.hotspots?.find((h) => h.productId === spot.productId) || tr.hotspots?.[idx];
        if (!spotTr) return spot;
        return {
          ...spot,
          label: nonEmpty(spotTr.label) ?? spot.label,
          tooltip: nonEmpty(spotTr.tooltip) ?? spot.tooltip,
        };
      })
    : post.hotspots;

  const localizedTitle = nonEmpty(tr.title) ?? post.title;
  const localizedExcerpt = nonEmpty(tr.excerpt) ?? post.excerpt;

  return {
    ...post,
    title: localizedTitle,
    excerpt: localizedExcerpt,
    body_mdx: nonEmpty(tr.body_mdx) ?? post.body_mdx,
    featured_image_alt: nonEmpty(tr.featured_image_alt) ?? post.featured_image_alt,
    category: nonEmpty(tr.category) ?? post.category,
    tags: Array.isArray(tr.tags) && tr.tags.length > 0 ? tr.tags : post.tags,
    meta_title: nonEmpty(tr.seo_title) ?? localizedTitle,
    meta_description: nonEmpty(tr.seo_description) ?? localizedExcerpt,
    hotspots: localizedHotspots,
  };
}

/**
 * Map a canonical category name or slug to its `categories.*` dictionary key.
 */
export function getCategorySlug(nameOrSlug: string): string | null {
  const lower = nameOrSlug.trim().toLowerCase();
  const found = CANONICAL_CATEGORIES.find(
    (c) =>
      c.slug.toLowerCase() === lower ||
      c.name.toLowerCase() === lower ||
      c.aliases?.some((a) => a.toLowerCase() === lower)
  );
  return found ? found.slug : null;
}

/**
 * Normalize finite material/part/finish strings into snake_case lookup keys for
 * `materials.parts.*`, `materials.materials.*`, and `materials.finishes.*`.
 */
export function toTermKey(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[&/]+/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
