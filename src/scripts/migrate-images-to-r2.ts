import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

async function migrateImages() {
  console.log('Starting image migration to R2 (skipping already-migrated)...');
  
  // Get all products with their images
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, article_no');
    
  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }
  
  console.log(`Found ${products?.length} products`);
  
  // Get all product images that are NOT already on R2
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, product_id, url, sort_order, is_primary')
    .not('url', 'ilike', '%r2.dev%')
    .not('url', 'ilike', '%r2.cloudflarestorage.com%');
    
  if (imagesError) {
    console.error('Error fetching images:', imagesError);
    return;
  }
  
  console.log(`Found ${images?.length} images to migrate`);
  
  if (!images || images.length === 0) {
    console.log('No images to migrate');
    return;
  }
  
  let migrated = 0;
  let failed = 0;
  
  for (const image of images) {
    try {
      const product = products?.find(p => p.id === image.product_id);
      if (!product) {
        console.warn(`Product not found for image ${image.id}`);
        failed++;
        continue;
      }
      
      const articleNo = product.article_no;
      
      // Download image from current URL
      console.log(`Downloading ${image.url}...`);
      const response = await fetch(image.url);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine file extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : 
                  contentType.includes('webp') ? 'webp' : 
                  contentType.includes('gif') ? 'gif' : 'jpg';
      
      // Generate R2 key
      const timestamp = Date.now();
      const sortOrder = image.sort_order || 0;
      const r2Key = `products/${articleNo}/${timestamp}-${sortOrder}.${ext}`;
      
      // Upload to R2
      console.log(`Uploading to R2: ${r2Key}...`);
      await r2Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      
      // Update database with new R2 URL
      const r2Url = `${process.env.R2_PUBLIC_URL}/${r2Key}`;
      
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ url: r2Url })
        .eq('id', image.id);
        
      if (updateError) {
        console.error(`Failed to update DB for image ${image.id}:`, updateError);
        failed++;
      } else {
        console.log(`✓ Migrated: ${image.url} → ${r2Url}`);
        migrated++;
      }
      
    } catch (error) {
      console.error(`✗ Failed to migrate image ${image.id} (${image.url}):`, error);
      failed++;
    }
  }
  
  console.log('\n--- Migration Complete ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${images?.length}`);
}

migrateImages().catch(console.error);