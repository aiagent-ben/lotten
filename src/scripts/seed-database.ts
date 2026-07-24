import { createServiceClient } from '@/lib/db/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Clean product format from data/clean/products_r2.json
interface CleanProduct {
  id: string;
  article_no: string;
  collection_id: string;  // e.g., "col-alford"
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
  materials: Array<{part: string; material: string; finish: string; code: string}> | null;
  colors: Array<{part: string; name: string; code: string; hex: string}> | null;
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
  images: Array<{id: string; product_id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean; width: number | null; height: number | null; created_at: string}>;
  r2_images: string[];
  r2_primary_image: string;
  processed: boolean;
}

function parseCollectionName(fullName: string | null | undefined): { name: string; brand: string } {
  if (!fullName) {
    return { name: 'Unknown', brand: '' };
  }
  const match = fullName.match(/^(.+?)\s*\((.+)\)$/);
  if (match) {
    return { name: match[1].trim(), brand: match[2].trim() };
  }
  return { name: fullName.trim(), brand: '' };
}

async function seedDatabase() {
  const supabase = createServiceClient();
  
  // Load products from clean JSON
  const cleanData = JSON.parse(
    fs.readFileSync(resolve(process.cwd(), 'data/clean/products_r2.json'), 'utf-8')
  );
  
  const cleanProducts: CleanProduct[] = cleanData.products || [];
  
  console.log(`Loaded ${cleanProducts.length} products from clean JSON`);
  
  // Extract unique brands and collections from collection_id
  // collection_id format: "col-alford", "col-brinhill", etc.
  // We need to derive brand from collection name or find another way
  const brandMap = new Map<string, {name: string; slug: string; description: string}>();
  const collectionMap = new Map<string, {name: string; slug: string; brand: string; description: string}>();
  
  for (const product of cleanProducts) {
    // collection_id is like "col-alford" - extract collection name
    const collectionSlug = product.collection_id.replace('col-', '');
    // We need to get the full collection name from somewhere
    // For now, use the slug as name and derive brand from product data
    const collectionName = collectionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const brandSlug = 'b2bfurniture'; // Default brand
    const brandName = 'B2B Furniture Supply';
    
    if (!brandMap.has(brandSlug)) {
      brandMap.set(brandSlug, {
        name: brandName,
        slug: brandSlug,
        description: `${brandName} furniture collection`
      });
    }
    
    if (!collectionMap.has(collectionSlug)) {
      collectionMap.set(collectionSlug, {
        name: collectionName,
        slug: collectionSlug,
        brand: brandSlug,
        description: `${collectionName} collection by ${brandName}`
      });
    }
  }
  
  console.log(`Found ${brandMap.size} brands and ${collectionMap.size} collections`);
  
  // 1. Seed brands
  console.log('Seeding brands...');
  for (const [slug, brand] of brandMap) {
    const { error } = await supabase
      .from('brands')
      .upsert({
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        sort_order: Array.from(brandMap.keys()).indexOf(slug),
      }, { onConflict: 'slug' });
    if (error) console.error('Brand error:', brand.name, error);
  }
  console.log('Brands seeded.');
  
  // 2. Seed collections
  console.log('Seeding collections...');
  for (const [slug, collection] of collectionMap) {
    const { data: brandData } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', collection.brand)
      .single();
    
    if (!brandData) {
      console.error('Brand not found:', collection.brand);
      continue;
    }
    
    const { error } = await supabase
      .from('collections')
      .upsert({
        brand_id: brandData.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        is_active: true,
        sort_order: Array.from(collectionMap.keys()).indexOf(slug),
      }, { onConflict: 'slug' });
    
    if (error) console.error('Collection error:', collection.name, error);
  }
  console.log('Collections seeded.');
  
  // 3. Seed products
  console.log('Seeding products...');
  let successCount = 0;
  let errorCount = 0;
  
  for (const cleanProduct of cleanProducts) {
    const collectionSlug = cleanProduct.collection_id.replace('col-', '');
    
    const { data: collectionData } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .single();
    
    if (!collectionData) {
      console.error('Collection not found:', collectionSlug);
      errorCount++;
      continue;
    }
    
    // Use already-structured data from clean format
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        article_no: cleanProduct.article_no,
        collection_id: collectionData.id,
        name: cleanProduct.name,
        slug: cleanProduct.slug,
        short_description: cleanProduct.short_description,
        description: cleanProduct.description,
        width_mm: cleanProduct.width_mm,
        depth_mm: cleanProduct.depth_mm,
        height_mm: cleanProduct.height_mm,
        weight_kg: cleanProduct.weight_kg,
        volume_m3: cleanProduct.volume_m3,
        pack_type: cleanProduct.pack_type,
        carton_length_mm: cleanProduct.carton_length_mm,
        carton_width_mm: cleanProduct.carton_width_mm,
        carton_height_mm: cleanProduct.carton_height_mm,
        materials: cleanProduct.materials,
        colors: cleanProduct.colors,
        price_usd: cleanProduct.price_usd,
        cost_usd: cleanProduct.cost_usd,
        moq: cleanProduct.moq,
        lead_time_weeks: cleanProduct.lead_time_weeks,
        stock_available: cleanProduct.stock_available,
        stock_reserved: cleanProduct.stock_reserved,
        stock_incoming: cleanProduct.stock_incoming,
        low_stock_threshold: cleanProduct.low_stock_threshold,
        is_active: cleanProduct.is_active,
        is_new: cleanProduct.is_new,
        is_bestseller: cleanProduct.is_bestseller,
        sort_order: cleanProduct.sort_order,
      }, { onConflict: 'article_no' })
      .select('id')
      .single();
    
    if (productError) {
      console.error('Product error:', cleanProduct.name, productError);
      errorCount++;
      continue;
    }
    
    successCount++;
    
    // Seed product images - use R2 images from cleaned data
    if (productData && cleanProduct.r2_images && cleanProduct.r2_images.length > 0) {
      // First, clean up any existing images for this product to avoid duplicates
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productData.id);
      
      for (let i = 0; i < cleanProduct.r2_images.length; i++) {
        const imgUrl = cleanProduct.r2_images[i];
        const { error: imgError } = await supabase
          .from('product_images')
          .insert({
            product_id: productData.id,
            url: imgUrl,
            alt_text: `${cleanProduct.name} - Image ${i + 1}`,
            sort_order: i,
            is_primary: i === 0,
          });
        if (imgError) {
          if (!imgError.message.includes('duplicate')) {
            console.error('Image error:', imgUrl, imgError);
          }
        }
      }
    }
  }
  
  console.log(`Products seeded: ${successCount} success, ${errorCount} errors`);
  console.log('Database seeding complete!');
}

seedDatabase().catch(console.error);