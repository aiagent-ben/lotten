import { createServiceClient } from '@/lib/db/client';
import type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';

// Per-request promise cache (module-level, survives across invocations in same process)
let productsPromise: Promise<Product[]> | null = null;
let collectionsPromise: Promise<Collection[]> | null = null;
let brandsPromise: Promise<Brand[]> | null = null;

async function loadProductsFromSupabase(): Promise<Product[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading products from Supabase:', error);
    throw error;
  }

  return data || [];
}

async function loadCollectionsFromSupabase(): Promise<Collection[]> {
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
}

async function loadBrandsFromSupabase(): Promise<Brand[]> {
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
}

function fetchProducts(): Promise<Product[]> {
  if (!productsPromise) {
    productsPromise = loadProductsFromSupabase();
  }
  return productsPromise;
}

function fetchCollections(): Promise<Collection[]> {
  if (!collectionsPromise) {
    collectionsPromise = loadCollectionsFromSupabase();
  }
  return collectionsPromise;
}

function fetchBrands(): Promise<Brand[]> {
  if (!brandsPromise) {
    brandsPromise = loadBrandsFromSupabase();
  }
  return brandsPromise;
}

// ============= Public API =============

export async function getAllActiveProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter(p => p.is_active);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find(p => p.slug === slug) || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find(p => p.id === id) || null;
}

export async function getProductsByCollection(collectionId: string): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter(p => p.collection_id === collectionId && p.is_active);
}

export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  const products = await fetchProducts();
  const featured = products.filter(p => p.is_active && (p.is_new || p.is_bestseller));
  return limit ? featured.slice(0, limit) : featured;
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchProducts();
}

export async function getCollections(): Promise<Collection[]> {
  return fetchCollections();
}

export async function getAllCollections(): Promise<Collection[]> {
  return fetchCollections();
}

export async function getCollectionsByBrand(brandId: string): Promise<Collection[]> {
  const collections = await fetchCollections();
  return collections.filter(c => c.brand_id === brandId);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const collections = await fetchCollections();
  return collections.find(c => c.slug === slug) || null;
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const collections = await fetchCollections();
  return collections.find(c => c.id === id) || null;
}

export async function getBrands(): Promise<Brand[]> {
  return fetchBrands();
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const brands = await fetchBrands();
  return brands.find(b => b.slug === slug) || null;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const brands = await fetchBrands();
  return brands.find(b => b.id === id) || null;
}

// Products by brand
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  const [collections, products] = await Promise.all([getCollections(), getAllProducts()]);
  const collectionsOfBrand = collections.filter(c => c.brand_id === brandId).map(c => c.id);
  return products.filter(p => p.is_active && collectionsOfBrand.includes(p.collection_id || ''));
}

// Formatting utilities
export function formatPrice(price: number | string, locale: string = 'en-MY'): string {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(priceNum) || priceNum === 0) return 'Contact for Price';
  
  // FX rate from USD to MYR - configurable via env var, fallback to 4.5
  const fxRate = parseFloat(process.env.USD_TO_MYR_RATE || '4.5');
  const myrPrice = priceNum * fxRate;
  
  return new Intl.NumberFormat(locale, {
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

// Type exports
export type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';