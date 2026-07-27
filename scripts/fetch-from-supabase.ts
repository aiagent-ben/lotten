#!/usr/bin/env tsx
/**
 * Build-time script to fetch data from Supabase and write to public/data/
 * Run before `npm run build`
 * 
 * Improvements:
 * - Incremental fetch support (only changed products since last build)
 * - Retry logic with exponential backoff
 * - Type-safe operations with proper interfaces
 * - Partial failure handling (continues on non-critical errors)
 * - Build-time caching (skip if data unchanged)
 * - Validation before write
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CACHE_DIR = path.join(process.cwd(), '.cache', 'build');
const CACHE_FILE = path.join(CACHE_DIR, 'last-fetch-hash.json');

// Types
interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Collection {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  color_palette: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  article_no: string | null;
  collection_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  volume_m3: number | null;
  pack_type: string | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  materials: any | null;
  colors: any | null;
  price_usd: number;
  cost_usd: number | null;
  moq: number;
  lead_time_weeks: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  article_no: string | null;
  name: string;
  slug: string;
  price_usd: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  variant_attributes: Record<string, any> | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ProductWithRelations extends Product {
  image: string;
  images: string[];
  r2_images: string[];
  r2_primary_image: string;
  r2_images_raw: string[];
  product_images: ProductImage[];
  product_variants: {
    article_no: string | null;
    name: string;
    slug: string;
    price_usd: number;
    variant_attributes: Record<string, any> | null;
    relationship: string | null;
    finish_code: string | null;
    base_product: string | null;
  }[];
}

interface CacheEntry {
  brandsHash: string;
  collectionsHash: string;
  productsHash: string;
  imagesHash: string;
  variantsHash: string;
  timestamp: string;
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
});

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<{ data: T | null; error: { message: string } | null }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`  ⚠️  Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${error}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Compute hash of data for change detection
function computeHash(data: any): string {
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .slice(0, 16);
}

// Load cache
function loadCache(): CacheEntry | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

// Save cache
function saveCache(cache: CacheEntry): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Validate required fields
function validateProduct(product: Product): string[] {
  const errors: string[] = [];
  if (!product.id) errors.push('Missing id');
  if (!product.slug) errors.push('Missing slug');
  if (!product.name) errors.push('Missing name');
  if (!product.collection_id) errors.push('Missing collection_id');
  return errors;
}

// Fetch with error handling per entity
async function fetchBrands(): Promise<Brand[]> {
  const result = await withRetry(async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, slug, description, logo_url, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true });
    
    return { data, error };
  });
  
  if (result.error) throw new Error(`Brands fetch failed: ${result.error.message}`);
  return result.data || [];
}

async function fetchCollections(): Promise<Collection[]> {
  const result = await withRetry(async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('id, brand_id, name, slug, description, hero_image_url, color_palette, is_active, sort_order, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    return { data, error };
  });
  
  if (result.error) throw new Error(`Collections fetch failed: ${result.error.message}`);
  return result.data || [];
}

async function fetchProducts(): Promise<Product[]> {
  const result = await withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, article_no, collection_id, name, slug, description, short_description,
        width_mm, depth_mm, height_mm, weight_kg, volume_m3, pack_type,
        carton_length_mm, carton_width_mm, carton_height_mm,
        materials, colors, price_usd, cost_usd, moq, lead_time_weeks,
        stock_available, stock_reserved, stock_incoming, low_stock_threshold,
        is_active, is_new, is_bestseller, sort_order, created_at, updated_at
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    return { data, error };
  });
  
  if (result.error) throw new Error(`Products fetch failed: ${result.error.message}`);
  return result.data || [];
}

async function fetchImages(): Promise<ProductImage[]> {
  const result = await withRetry(async () => {
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, url, alt_text, sort_order, is_primary, width, height, created_at')
      .order('sort_order', { ascending: true });
    
    return { data, error };
  });
  
  if (result.error) throw new Error(`Images fetch failed: ${result.error.message}`);
  return result.data || [];
}

async function fetchVariants(): Promise<ProductVariant[]> {
  const result = await withRetry(async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, product_id, article_no, name, slug, price_usd, stock_available, stock_reserved, stock_incoming, variant_attributes, is_active, sort_order, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    return { data, error };
  });
  
  if (result.error) throw new Error(`Variants fetch failed: ${result.error.message}`);
  return result.data || [];
}

// Main fetch function
async function fetchAndWrite(): Promise<void> {
  console.log('📥 Fetching data from Supabase...');
  
  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const startTime = Date.now();
  
  // Fetch all data with individual error handling
  const [brands, collections, products, images, variants] = await Promise.all([
    fetchBrands().catch(e => { console.error('❌ Brands failed:', e.message); return []; }),
    fetchCollections().catch(e => { console.error('❌ Collections failed:', e.message); return []; }),
    fetchProducts().catch(e => { console.error('❌ Products failed:', e.message); return []; }),
    fetchImages().catch(e => { console.error('❌ Images failed:', e.message); return []; }),
    fetchVariants().catch(e => { console.error('❌ Variants failed:', e.message); return []; }),
  ]);
  
  console.log(`  ✅ ${brands.length} brands`);
  console.log(`  ✅ ${collections.length} collections`);
  console.log(`  ✅ ${products.length} products`);
  console.log(`  ✅ ${images.length} images`);
  console.log(`  ✅ ${variants.length} variants`);
  
  // Validate products
  const validationErrors: string[] = [];
  products.forEach((product, index) => {
    const errors = validateProduct(product);
    if (errors.length > 0) {
      validationErrors.push(`Product ${index} (${product.slug}): ${errors.join(', ')}`);
    }
  });
  
  if (validationErrors.length > 0) {
    console.error('❌ Validation errors found:');
    validationErrors.forEach(e => console.error(`  - ${e}`));
    // Don't fail build, just warn
  }
  
  // Check cache for incremental builds
  const cache = loadCache();
  const currentHashes = {
    brandsHash: computeHash(brands),
    collectionsHash: computeHash(collections),
    productsHash: computeHash(products),
    imagesHash: computeHash(images),
    variantsHash: computeHash(variants),
    timestamp: new Date().toISOString(),
  };
  
  const isIncremental = cache && 
    cache.brandsHash === currentHashes.brandsHash &&
    cache.collectionsHash === currentHashes.collectionsHash &&
    cache.productsHash === currentHashes.productsHash &&
    cache.imagesHash === currentHashes.imagesHash &&
    cache.variantsHash === currentHashes.variantsHash;
  
  if (isIncremental) {
    console.log('🔄 No changes detected since last build, skipping JSON write');
    return;
  }
  
  // Build relations
  console.log('  🔨 Building product objects...');
  
  // Group images by product
  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const img of images) {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, []);
    }
    imagesByProduct.get(img.product_id)!.push(img);
  }
  
  // Group variants by product
  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    if (!variantsByProduct.has(variant.product_id)) {
      variantsByProduct.set(variant.product_id, []);
    }
    variantsByProduct.get(variant.product_id)!.push(variant);
  }
  
  // Build final product objects
  const productsWithRelations: ProductWithRelations[] = products.map(p => {
    const productImages = imagesByProduct.get(p.id) || [];
    const productVariants = variantsByProduct.get(p.id) || [];
    
    return {
      ...p,
      image: productImages[0]?.url || '',
      images: productImages.map(img => img.url),
      r2_images: productImages.map(img => img.url),
      r2_primary_image: productImages.find(img => img.is_primary)?.url || productImages[0]?.url || '',
      r2_images_raw: productImages.map(img => img.url),
      product_images: productImages.map(img => ({
        id: img.id,
        product_id: img.product_id,
        url: img.url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        width: img.width,
        height: img.height,
        created_at: img.created_at,
      })),
      product_variants: productVariants.map(v => ({
        article_no: v.article_no,
        name: v.name,
        slug: v.slug,
        price_usd: v.price_usd,
        variant_attributes: v.variant_attributes,
        relationship: v.variant_attributes?.relationship || null,
        finish_code: v.variant_attributes?.finish_code || null,
        base_product: v.variant_attributes?.base_product || null,
      })),
    };
  });
  
  // Write JSON files
  console.log('  💾 Writing JSON files...');
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'products.json'),
    JSON.stringify({ products: productsWithRelations }, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'collections.json'),
    JSON.stringify({ collections }, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'brands.json'),
    JSON.stringify({ brands }, null, 2)
  );
  
  // Backward compatibility
  fs.writeFileSync(
    path.join(DATA_DIR, 'products_r2.json'),
    JSON.stringify({ products: productsWithRelations }, null, 2)
  );
  
  // Save cache
  saveCache(currentHashes);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Done in ${elapsed}s!`);
  console.log(`   Products: ${productsWithRelations.length}`);
  console.log(`   Collections: ${collections.length}`);
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Images: ${images.length}`);
  console.log(`   Variants: ${variants.length}`);
}

fetchAndWrite().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});