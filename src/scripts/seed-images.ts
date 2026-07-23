import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Clear existing product images first
  console.log('Clearing existing product images...');
  const { error: delError } = await supabase
    .from('product_images')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  
  if (delError) console.error('Delete error:', delError);
  else console.log('Existing images cleared');
  
  // Now re-run seeding for images only
  console.log('Re-seeding images...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, article_no, name');
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log(`Found ${products?.length} products`);
  
  // Re-read raw products from JSON
  const fs = require('fs');
  const path = require('path');
  const rawProducts = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/scripts/products.json'), 'utf-8'));
  
  for (const rawProduct of rawProducts) {
    const product = products?.find(p => p.article_no === rawProduct.articleNo);
    if (!product) continue;
    
    for (let i = 0; i < rawProduct.images.length; i++) {
      const imgUrl = rawProduct.images[i];
      const { error: imgError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          url: imgUrl,
          alt_text: `${rawProduct.name} - Image ${i + 1}`,
          sort_order: i,
          is_primary: i === 0,
        });
      if (imgError && !imgError.message.includes('duplicate')) {
        console.error('Image error:', imgUrl, imgError);
      }
    }
  }
  
  console.log('Image seeding complete!');
}

main().catch(console.error);