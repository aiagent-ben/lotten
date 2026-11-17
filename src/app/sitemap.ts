import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { getAllActiveProducts, getCollections } from '@/lib/data/products';
import { getPublishedContentByType } from '@/lib/data/content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lotten.com';

const hreflangMap: Record<string, string> = {
  en: 'en',
  my: 'ms-MY',
  zh: 'zh-Hans',
};

function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[hreflangMap[loc] || loc] = `${SITE_URL}/${loc}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/en${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '',
    '/products',
    '/collections',
    '/blog',
    '/guides',
    '/lookbooks',
    '/about',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/search',
  ];

  const [products, collections, blogs, guides, lookbooks, pages] = await Promise.all([
    getAllActiveProducts().catch(() => []),
    getCollections().catch(() => []),
    getPublishedContentByType('blog', 100).catch(() => []),
    getPublishedContentByType('guide', 100).catch(() => []),
    getPublishedContentByType('lookbook', 100).catch(() => []),
    getPublishedContentByType('page', 100).catch(() => []),
  ]);

  const dynamicPaths = [
    ...products.map((p) => `/products/${p.slug}`),
    ...collections.filter((c) => c.is_active).map((c) => `/collections/${c.slug}`),
    ...blogs.map((b) => `/blog/${b.slug}`),
    ...guides.map((g) => `/guides/${g.slug}`),
    ...lookbooks.map((l) => `/lookbooks/${l.slug}`),
    ...pages.map((pg) => `/${pg.slug}`),
  ];

  const allPaths = [...staticPaths, ...dynamicPaths];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    const alternates = buildAlternates(path);
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        alternates,
      });
    }
  }

  return entries;
}
