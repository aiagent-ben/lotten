#!/usr/bin/env tsx
/**
 * Build-time script to fetch data from Supabase and write to public/data/
 * Run before `npm run build`
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

async function fetchAndWrite() {
  console.log('📥 Fetching data from Supabase...');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Fetch brands
  console.log('  📥 Fetching brands...');
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('id, name, slug, description, logo_url, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });
  
  if (brandsError) throw brandsError;
  console.log(`  ✅ ${brands.length} brands`);

  // 2. Fetch collections with brand info
  console.log('  📥 Fetching collections...');
  const { data: collections, error: collectionsError } = await supabase
    .from('collections')
    .select('id, brand_id, name, slug, description, hero_image_url, color_palette, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (collectionsError) throw collectionsError;
  console.log(`  ✅ ${collections.length} collections`);

  // 3. Fetch products with all fields
  console.log('  📥 Fetching products...');
  const { data: products, error: productsError } = await supabase
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
  
  if (productsError) throw productsError;
  console.log(`  ✅ ${products.length} products`);

  // 4. Fetch product images
  console.log('  📥 Fetching product images...');
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, product_id, url, alt_text, sort_order, is_primary, width, height, created_at')
    .order('sort_order', { ascending: true });
  
  if (imagesError) throw imagesError;
  console.log(`  ✅ ${images.length} images`);

  // 5. Fetch product variants
  console.log('  📥 Fetching product variants...');
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, product_id, article_no, name, slug, price_usd, stock_available, stock_reserved, stock_incoming, variant_attributes, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (variantsError) throw variantsError;
  console.log(`  ✅ ${variants.length} variants`);

  // 6. Build product objects with nested data
  console.log('  🔨 Building product objects...');
  
  // Group images by product
  const imagesByProduct = new Map<string, typeof images>();
  for (const img of images) {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, []);
    }
    imagesByProduct.get(img.product_id)!.push(img);
  }

  // Group variants by product
  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants) {
    if (!variantsByProduct.has(variant.product_id)) {
      variantsByProduct.set(variant.product_id, []);
    }
    variantsByProduct.get(variant.product_id)!.push(variant);
  }

  // Build final product objects matching the expected TypeScript interface
  const productsWithRelations = products.map(p => {
    const productImages = imagesByProduct.get(p.id) || [];
    const productVariants = variantsByProduct.get(p.id) || [];

    return {
      id: p.id,
      article_no: p.article_no,
      collection_id: p.collection_id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      width_mm: p.width_mm,
      depth_mm: p.depth_mm,
      height_mm: p.height_mm,
      weight_kg: p.weight_kg,
      volume_m3: p.volume_m3,
      pack_type: p.pack_type,
      carton_length_mm: p.carton_length_mm,
      carton_width_mm: p.carton_width_mm,
      carton_height_mm: p.carton_height_mm,
      materials: p.materials,
      colors: p.colors,
      price_usd: p.price_usd,
      cost_usd: p.cost_usd,
      moq: p.moq,
      lead_time_weeks: p.lead_time_weeks,
      stock_available: p.stock_available,
      stock_reserved: p.stock_reserved,
      stock_incoming: p.stock_incoming,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      is_new: p.is_new,
      is_bestseller: p.is_bestseller,
      sort_order: p.sort_order,
      created_at: p.created_at,
      updated_at: p.updated_at,
      // Computed fields for the frontend - use productImages from imagesByProduct
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
        created_at: img.created_at
      })),
      product_variants: productVariants.map(v => ({
        article_no: v.article_no,
        name: v.name,
        slug: v.slug,
        price_usd: v.price_usd,
        variant_attributes: v.variant_attributes,
        relationship: v.variant_attributes?.relationship,
        finish_code: v.variant_attributes?.finish_code,
        base_product: v.variant_attributes?.base_product
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

  // Also write a simple products array for backward compatibility
  fs.writeFileSync(
    path.join(DATA_DIR, 'products_r2.json'),
    JSON.stringify({ products: productsWithRelations }, null, 2)
  );

  console.log('✅ Done!');
  console.log(`   Products: ${productsWithRelations.length}`);
  console.log(`   Collections: ${collections.length}`);
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Images: ${images.length}`);
  console.log(`   Variants: ${variants.length}`);
}

fetchAndWrite().catch(console.error);