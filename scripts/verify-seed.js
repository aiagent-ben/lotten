import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verify() {
  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: collectionsCount } = await supabase.from('collections').select('*', { count: 'exact', head: true });
  const { count: brandsCount } = await supabase.from('brands').select('*', { count: 'exact', head: true });
  const { count: imagesCount } = await supabase.from('product_images').select('*', { count: 'exact', head: true });

  console.log('Products:', productsCount);
  console.log('Collections:', collectionsCount);
  console.log('Brands:', brandsCount);
  console.log('Product Images:', imagesCount);

  // Check a sample product
  const { data: sample } = await supabase.from('products').select('id, name, article_no, width_mm, weight_kg, materials, colors').limit(1).single();
  console.log('\nSample product:');
  console.log(JSON.stringify(sample, null, 2));
  
  // Check images for that product
  const { data: images } = await supabase.from('product_images').select('url, is_primary, sort_order').eq('product_id', sample?.id);
  console.log('\nSample product images:');
  console.log(JSON.stringify(images, null, 2));
}

verify().catch(console.error);