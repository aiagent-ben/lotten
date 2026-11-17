import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/db/client';
import type { Brand, Collection, Product } from '@/lib/types/database';
import {
  localizeBrand,
  localizeCollection,
  localizeProduct,
  toBcp47Locale,
} from '@/lib/i18n/localize';

const PRODUCT_CHUNK_SIZE = 120;

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delayMs = 150 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function loadActiveProductCount(): Promise<number> {
  return withRetry(async () => {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error counting products from Supabase:', error);
      throw error;
    }

    return count ?? 0;
  });
}

async function loadProductsChunkFromSupabase(chunkIndex: number): Promise<Product[]> {
  return withRetry(async () => {
    const from = chunkIndex * PRODUCT_CHUNK_SIZE;
    const to = from + PRODUCT_CHUNK_SIZE - 1;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error loading products from Supabase:', error);
      throw error;
    }

    return data || [];
  });
}

async function loadCollectionsFromSupabase(): Promise<Collection[]> {
  return withRetry(async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading collections from Supabase:', error);
      throw error;
    }

    return data || [];
  });
}

async function loadBrandsFromSupabase(): Promise<Brand[]> {
  return withRetry(async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading brands from Supabase:', error);
      throw error;
    }

    return data || [];
  });
}

const getCachedProductCount = unstable_cache(
  loadActiveProductCount,
  ['catalog-product-count-v1'],
  { revalidate: 3600, tags: ['products'] }
);

const getCachedProductsChunk = unstable_cache(
  loadProductsChunkFromSupabase,
  ['catalog-products-chunk-v1'],
  { revalidate: 3600, tags: ['products'] }
);

const getCachedCollections = unstable_cache(
  loadCollectionsFromSupabase,
  ['catalog-collections-v1'],
  { revalidate: 3600, tags: ['collections'] }
);

const getCachedBrands = unstable_cache(
  loadBrandsFromSupabase,
  ['catalog-brands-v1'],
  { revalidate: 3600, tags: ['brands'] }
);

async function runWithCacheFallback<T>(cachedFn: () => Promise<T>, directFn: () => Promise<T>): Promise<T> {
  try {
    return await cachedFn();
  } catch (err) {
    if (err instanceof Error && err.message.includes('incrementalCache')) {
      return directFn();
    }
    throw err;
  }
}

// Per-request deduplication via React.cache with graceful fallback outside Next.js (Vitest/CLI)
const fetchCollections = cache((): Promise<Collection[]> =>
  runWithCacheFallback(getCachedCollections, loadCollectionsFromSupabase)
);

const fetchBrands = cache((): Promise<Brand[]> =>
  runWithCacheFallback(getCachedBrands, loadBrandsFromSupabase)
);

const fetchProducts = cache(async (): Promise<Product[]> => {
  const [totalCount, collections] = await Promise.all([
    runWithCacheFallback(getCachedProductCount, loadActiveProductCount),
    fetchCollections(),
  ]);

  const chunkCount = Math.max(1, Math.ceil(totalCount / PRODUCT_CHUNK_SIZE));
  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      runWithCacheFallback(
        () => getCachedProductsChunk(index),
        () => loadProductsChunkFromSupabase(index)
      )
    )
  );

  const collectionById = new Map(collections.map((c) => [c.id, c]));
  return chunks.flat().map((product) => ({
    ...product,
    collection: product.collection_id ? collectionById.get(product.collection_id) : undefined,
  }));
});

// ============= Public API =============

export async function getAllActiveProducts(locale = 'en'): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.is_active).map((p) => localizeProduct(p, locale));
}

export async function getProductBySlug(slug: string, locale = 'en'): Promise<Product | null> {
  const products = await fetchProducts();
  const found = products.find((p) => p.slug === slug || p.id === slug);
  return found ? localizeProduct(found, locale) : null;
}

export async function getProductById(id: string, locale = 'en'): Promise<Product | null> {
  const products = await fetchProducts();
  const found = products.find((p) => p.id === id);
  return found ? localizeProduct(found, locale) : null;
}

export async function getProductsByCollection(collectionId: string, locale = 'en'): Promise<Product[]> {
  const products = await fetchProducts();
  return products
    .filter((p) => p.collection_id === collectionId && p.is_active)
    .map((p) => localizeProduct(p, locale));
}

export async function getFeaturedProducts(limit?: number, locale = 'en'): Promise<Product[]> {
  const products = await fetchProducts();
  const featured = products.filter((p) => p.is_active && (p.is_new || p.is_bestseller));
  const result = featured.length > 0 ? featured : products.filter((p) => p.is_active);
  const sliced = limit ? result.slice(0, limit) : result;
  return sliced.map((p) => localizeProduct(p, locale));
}

export async function getAllProducts(locale = 'en'): Promise<Product[]> {
  const products = await fetchProducts();
  return products.map((p) => localizeProduct(p, locale));
}

export async function getCollections(locale = 'en'): Promise<Collection[]> {
  const collections = await fetchCollections();
  return collections.map((c) => localizeCollection(c, locale));
}

export async function getAllCollections(locale = 'en'): Promise<Collection[]> {
  const collections = await fetchCollections();
  return collections.map((c) => localizeCollection(c, locale));
}

export async function getCollectionsByBrand(brandId: string, locale = 'en'): Promise<Collection[]> {
  const collections = await fetchCollections();
  return collections
    .filter((c) => c.brand_id === brandId)
    .map((c) => localizeCollection(c, locale));
}

export async function getCollectionBySlug(slug: string, locale = 'en'): Promise<Collection | null> {
  const collections = await fetchCollections();
  const found = collections.find((c) => c.slug === slug);
  return found ? localizeCollection(found, locale) : null;
}

export async function getCollectionById(id: string, locale = 'en'): Promise<Collection | null> {
  const collections = await fetchCollections();
  const found = collections.find((c) => c.id === id);
  return found ? localizeCollection(found, locale) : null;
}

export async function getBrands(locale = 'en'): Promise<Brand[]> {
  const brands = await fetchBrands();
  return brands.map((b) => localizeBrand(b, locale));
}

export async function getBrandBySlug(slug: string, locale = 'en'): Promise<Brand | null> {
  const brands = await fetchBrands();
  const found = brands.find((b) => b.slug === slug);
  return found ? localizeBrand(found, locale) : null;
}

export async function getBrandById(id: string, locale = 'en'): Promise<Brand | null> {
  const brands = await fetchBrands();
  const found = brands.find((b) => b.id === id);
  return found ? localizeBrand(found, locale) : null;
}

// Products by brand
export async function getProductsByBrand(brandId: string, locale = 'en'): Promise<Product[]> {
  const [collections, products] = await Promise.all([getCollections(locale), getAllProducts(locale)]);
  const collectionsOfBrand = collections.filter((c) => c.brand_id === brandId).map((c) => c.id);
  return products.filter((p) => p.is_active && collectionsOfBrand.includes(p.collection_id || ''));
}

// Formatting utilities
export function formatPrice(
  price: number | string,
  locale: string = 'en-MY',
  contactLabel: string = 'Contact for Price'
): string {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(priceNum) || priceNum === 0) return contactLabel;

  // FX rate from USD to MYR - configurable via env var, fallback to 4.5
  const fxRate = parseFloat(process.env.USD_TO_MYR_RATE || '4.5');
  const myrPrice = priceNum * fxRate;

  return new Intl.NumberFormat(toBcp47Locale(locale), {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(myrPrice);
}

export function getColorHex(colorCode: string): string {
  const colorMap: Record<string, string> = {
    '1001': '#8B7355', '1002': '#A0522D', '1003': '#DEB887', '1004': '#D2691E',
    '1005': '#8B4513', '1006': '#CD853F', '1007': '#F4A460', '1008': '#DAA520',
    '1802': '#8B7355', '1804': '#A0522D', '1808': '#DEB887', '1810': '#D2691E',
    '801': '#8B7355', '802': '#A0522D', '803': '#DEB887', '804': '#D2691E',
    '805': '#8B4513', '806': '#CD853F', '807': '#F4A460', '808': '#DAA520',
    '109': '#8B7355', '111': '#A0522D', '113': '#DEB887', '114': '#D2691E',
    '115': '#8B4513', '116': '#CD853F', '117': '#F4A460', '118': '#DAA520',
    '102': '#8B7355', '103': '#A0522D', '104': '#DEB887', '105': '#D2691E',
    '170': '#8B7355', '171': '#A0522D', '172': '#DEB887', '173': '#D2691E',
  };
  return colorMap[colorCode] || '#8B7355';
}

export type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';
