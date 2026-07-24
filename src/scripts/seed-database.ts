import { createServiceClient } from '@/lib/db/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  images: string[];
  price: string;
  collection: string;
  description: string;
  materials: string;
  colors: string;
  specifications: string;
  dimensions: string;
  weight: string;
  cartonDimensions: string;
  articleNo: string;
  // R2 fields from cleaned data
  r2_images?: string[];
  r2_primary_image?: string;
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

function parseSpecifications(specs: string): {
  width?: number;
  depth?: number;
  height?: number;
  weight?: number;
  volume?: number;
  packType?: string;
} {
  const result: any = {};
  
  const dimMatch = specs.match(/Dimension\s*\(mm\):\s*W(\d+)\s*D(\d+)\s*H(\d+)/i);
  if (dimMatch) {
    result.width = parseInt(dimMatch[1]);
    result.depth = parseInt(dimMatch[2]);
    result.height = parseInt(dimMatch[3]);
  }
  
  const weightMatch = specs.match(/Gross Weight\s*\(kg\):\s*([\d.]+)/i);
  if (weightMatch) {
    result.weight = parseFloat(weightMatch[1]);
  }
  
  const volumeMatch = specs.match(/m³?\s*:\s*([\d.]+)/i);
  if (volumeMatch) {
    result.volume = parseFloat(volumeMatch[1]);
  }
  
  const packMatch = specs.match(/Pack Type:\s*(.+)/i);
  if (packMatch) {
    result.packType = packMatch[1].trim();
  }
  
  return result;
}

function parseCartonDimensions(cartonStr: string): {
  length?: number;
  width?: number;
  height?: number;
} {
  const result: any = {};
  const match = cartonStr.match(/L(\d+)\s*W(\d+)\s*H(\d+)/i);
  if (match) {
    result.length = parseInt(match[1]);
    result.width = parseInt(match[2]);
    result.height = parseInt(match[3]);
  }
  return result;
}

function parseMaterials(materialsStr: string): Array<{part: string; material: string; finish: string; code: string}> {
  const lines = materialsStr.split('\n').filter(l => l.trim() && !l.includes('Article No'));
  const result = [];
  
  for (const line of lines) {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) {
      const part = match[1].trim();
      const value = match[2].trim();
      // Try to extract material and finish
      const parts = value.split('+').map(p => p.trim());
      const material = parts[0] || '';
      const finish = parts[1] || '';
      result.push({ part, material, finish, code: '' });
    }
  }
  return result;
}

function parseColors(colorsStr: string): Array<{part: string; name: string; code: string; hex: string}> {
  const lines = colorsStr.split('\n').filter(l => l.trim());
  const result = [];
  
  for (const line of lines) {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) {
      const part = match[1].trim();
      const value = match[2].trim();
      // Extract code (first word) and name (rest)
      const parts = value.split(' ');
      const code = parts[0] || '';
      const name = parts.slice(1).join(' ') || value;
      result.push({ part, name, code, hex: '#FFFFFF' });
    }
  }
  return result;
}

async function seedDatabase() {
  const supabase = createServiceClient();
  
  // Load products from JSON
  const rawProducts: RawProduct[] = JSON.parse(
    fs.readFileSync(resolve(process.cwd(), 'src/scripts/products.json'), 'utf-8')
  );
  
  console.log(`Loaded ${rawProducts.length} products from JSON`);
  
  // Extract unique brands and collections
  const brandMap = new Map<string, {name: string; slug: string; description: string}>();
  const collectionMap = new Map<string, {name: string; slug: string; brand: string; description: string}>();
  
  for (const product of rawProducts) {
    const { name: collectionName, brand: brandName } = parseCollectionName(product.collection);
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const collectionSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
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
  for (const rawProduct of rawProducts) {
    const { name: collectionName, brand: brandName } = parseCollectionName(rawProduct.collection);
    const collectionSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data: collectionData } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .single();
    
    if (!collectionData) {
      console.error('Collection not found:', collectionSlug);
      continue;
    }
    
    const specs = parseSpecifications(rawProduct.specifications);
    const carton = parseCartonDimensions(rawProduct.cartonDimensions);
    const materials = parseMaterials(rawProduct.materials);
    const colors = parseColors(rawProduct.colors);
    
    // Use articleNo as price fallback (since price is "Contact for Price")
    const price = 0; // Will be set manually later
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        article_no: rawProduct.articleNo,
        collection_id: collectionData.id,
        name: rawProduct.name,
        slug: rawProduct.slug,
        short_description: rawProduct.description.substring(0, 200),
        description: rawProduct.description,
        width_mm: specs.width,
        depth_mm: specs.depth,
        height_mm: specs.height,
        weight_kg: specs.weight,
        volume_m3: specs.volume,
        pack_type: specs.packType,
        carton_length_mm: carton.length,
        carton_width_mm: carton.width,
        carton_height_mm: carton.height,
        materials: materials,
        colors: colors,
        price_usd: price,
        cost_usd: null,
        moq: 1,
        lead_time_weeks: 8,
        stock_available: 10,
        stock_reserved: 0,
        stock_incoming: 0,
        low_stock_threshold: 5,
        is_active: true,
        is_new: false,
        is_bestseller: false,
        sort_order: 0,
      }, { onConflict: 'article_no' })
      .select('id')
      .single();
    
    if (productError) {
      console.error('Product error:', rawProduct.name, productError);
      continue;
    }

        // Seed product images - use R2 images from cleaned data
        if (productData && rawProduct.r2_images && rawProduct.r2_images.length > 0) {
          // First, clean up any existing images for this product to avoid duplicates
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productData.id);

          for (let i = 0; i < rawProduct.r2_images.length; i++) {
            const imgUrl = rawProduct.r2_images[i];
            const { error: imgError } = await supabase
              .from('product_images')
              .insert({
                product_id: productData.id,
                url: imgUrl,
                alt_text: `${rawProduct.name} - Image ${i + 1}`,
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
  console.log('Products seeded.');
  
  console.log('Database seeding complete!');
}

seedDatabase().catch(console.error);