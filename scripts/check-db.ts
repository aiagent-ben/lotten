import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: brands } = await supabase.from('brands').select('*');
  console.log('Brands:', JSON.stringify(brands, null, 2));

  const { data: collections } = await supabase.from('collections').select('*');
  console.log('Collections:', collections?.length);
  collections?.forEach(c => console.log('  ', c.id, c.slug, c.name, c.brand_id));

  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log('Products count:', productsCount);
  
  const { data: sampleProducts } = await supabase.from('products').select('name, slug, article_no, collection_id, is_active').limit(5);
  console.log('Sample products:', JSON.stringify(sampleProducts, null, 2));
}

checkDb().catch(console.error);