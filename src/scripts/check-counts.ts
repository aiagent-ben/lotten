import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tables = ['brands', 'collections', 'products', 'product_images', 'product_variants', 'site_settings'];

async function checkCounts() {
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(table + ':', count, error ? error.message : '');
  }
}

checkCounts().catch(console.error);