// Products data - synchronous access for build-time rendering
// This module reads from public JSON file at build time using Node.js fs

import type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';

// Load products from JSON file at build time (server-side only)
function loadProductsSync(): Product[] {
  if (typeof window !== 'undefined') {
    // Client-side: return empty array, use async functions instead
    return [];
  }
  
  try {
    // Use require for Node.js fs module (only runs on server)
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'products.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.products || data;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

// Load products at module initialization (build time - server only)
const products = loadProductsSync();

// ============= Synchronous exports for build-time rendering =============

export function getAllActiveProducts(): Product[] {
  return products.filter(p => p.is_active);
}

export function getProductBySlug(slug: string): Product | null {
  return products.find(p => p.slug === slug) || null;
}

export function getProductById(id: string): Product | null {
  return products.find(p => p.id === id) || null;
}

export function getProductsByCollection(collectionId: string): Product[] {
  return products.filter(p => p.collection_id === collectionId && p.is_active);
}

export function getFeaturedProducts(limit?: number): Product[] {
  const featured = products.filter(p => p.is_active && (p.is_new || p.is_bestseller));
  return limit ? featured.slice(0, limit) : featured;
}

export function getAllProducts(): Product[] {
  return products;
}

// Collections derived from products
const collectionMap = new Map<string, Collection>();

products.forEach(p => {
  if (p.collection_id && !collectionMap.has(p.collection_id)) {
    collectionMap.set(p.collection_id, {
      id: p.collection_id,
      brand_id: 'brand-lotten',
      name: p.collection_id.replace('col-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: p.collection_id,
      brand: undefined,
      description: null,
      hero_image_url: null,
      color_palette: null,
      is_active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
});

const collections = Array.from(collectionMap.values());

export function getCollections(): Collection[] {
  return collections;
}

export function getAllCollections(): Collection[] {
  return collections;
}

export function getCollectionsByBrand(brand: string): Collection[] {
  return collections.filter(c => c.brand?.name?.toLowerCase() === brand.toLowerCase());
}

export function getCollectionBySlug(slug: string): Collection | null {
  return collections.find(c => c.slug === slug) || null;
}

export function getCollectionById(id: string): Collection | null {
  return collections.find(c => c.id === id) || null;
}

export function getCollectionName(collectionId: string): string {
  const collectionsMap: Record<string, string> = {
    'col-breda': 'Breda',
    'col-dover': 'Dover',
    'col-malton': 'Malton',
    'col-lamar': 'Lamar',
    'col-kyoto': 'Kyoto',
    'col-dudley': 'Dudley',
    'col-ludlow': 'Ludlow',
    'col-loftus': 'Loftus',
    'col-hutto': 'Hutto',
    'col-royston': 'Royston',
    'col-oruro': 'Oruro',
    'col-waldo': 'Waldo',
    'col-castor': 'Castor',
    'col-hayton': 'Hayton',
    'col-neath': 'Neath',
    'col-hampton': 'Hampton',
    'col-noud': 'Noud',
    'col-nakula': 'Nakula',
    'col-alford': 'Alford',
    'col-alford-solid': 'Alford Solid',
    'col-alford-veneer': 'Alford Veneer',
    'col-sivan': 'Sivan',
    'col-torrell': 'Torell',
    'col-madrid': 'Madrid',
    'col-forres': 'Forres',
    'col-hamilton': 'Hamilton',
    'col-brinhill': 'Brinhill',
  };
  return collectionsMap[collectionId] || 'Collection';
}

// Brands derived from collections
const brandMap = new Map<string, Brand>();

collections.forEach(c => {
  const brandName = c.brand?.name || 'Lotten';
  if (brandName && !brandMap.has(brandName)) {
    brandMap.set(brandName, {
      id: brandName.toLowerCase().replace(/\s+/g, '-'),
      name: brandName,
      slug: brandName.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      logo_url: '',
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
});

const brands = Array.from(brandMap.values());

export { products, collections, brands };

export function getBrands(): Brand[] {
  return brands;
}

// Products by brand
export function getProductsByBrand(brand: string): Product[] {
  const collectionsOfBrand = collections
    .filter(c => c.brand?.name?.toLowerCase() === brand.toLowerCase())
    .map(c => c.id);
  return products.filter(p => p.is_active && collectionsOfBrand.includes(p.collection_id || ''));
}

// Formatting utilities
export function formatPrice(priceUsd: number | string): string {
  const price = typeof priceUsd === 'string' ? parseFloat(priceUsd) : priceUsd;
  if (isNaN(price) || price === 0) return 'Contact for Price';
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
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

// Async versions for runtime use (client components)
export async function getProductsAsync(): Promise<Product[]> {
  return products;
}

export async function getProductBySlugAsync(slug: string): Promise<Product | null> {
  return products.find(p => p.slug === slug) || null;
}

export async function getProductByIdAsync(id: string): Promise<Product | null> {
  return products.find(p => p.id === id) || null;
}

export async function getAllActiveProductsAsync(): Promise<Product[]> {
  return products.filter(p => p.is_active);
}

export async function getProductsByCollectionAsync(collectionId: string): Promise<Product[]> {
  return products.filter(p => p.collection_id === collectionId && p.is_active);
}

export async function getFeaturedProductsAsync(): Promise<Product[]> {
  return products.filter(p => p.is_active && (p.is_new || p.is_bestseller));
}

export async function getCollectionsAsync(): Promise<Collection[]> {
  return collections;
}

export async function getAllCollectionsAsync(): Promise<Collection[]> {
  return collections;
}

export async function getCollectionsByBrandAsync(brand: string): Promise<Collection[]> {
  return collections.filter(c => c.brand?.name?.toLowerCase() === brand.toLowerCase());
}

export async function getCollectionBySlugAsync(slug: string): Promise<Collection | null> {
  return collections.find(c => c.slug === slug) || null;
}

export async function getCollectionByIdAsync(id: string): Promise<Collection | null> {
  return collections.find(c => c.id === id) || null;
}

export async function getProductsByBrandAsync(brand: string): Promise<Product[]> {
  const collectionsOfBrand = collections
    .filter(c => c.brand?.name?.toLowerCase() === brand.toLowerCase())
    .map(c => c.id);
  return products.filter(p => p.is_active && collectionsOfBrand.includes(p.collection_id || ''));
}

export async function getBrandsAsync(): Promise<Brand[]> {
  const brandMap = new Map<string, Brand>();
  
  collections.forEach(c => {
    if (c.brand && !brandMap.has(c.brand.name)) {
      brandMap.set(c.brand.name, {
        id: c.brand.name.toLowerCase().replace(/\s+/g, '-'),
        name: c.brand.name,
        slug: c.brand.name.toLowerCase().replace(/\s+/g, '-'),
        description: c.brand.description || '',
        logo_url: c.brand.logo_url || '',
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  });
  
  return Array.from(brandMap.values());
}

// Type exports
export type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';
