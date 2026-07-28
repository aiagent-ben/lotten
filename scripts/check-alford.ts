import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env first
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkAlford() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: collections } = await supabase.from('collections').select('id, slug, name').ilike('slug', '%alford%');
  console.log('Collections:', collections);

  const { data: products } = await supabase.from('products').select('id, name, slug, article_no, collection_id').ilike('slug', '%alford%');
  console.log('Products:', products?.length);
  products?.forEach(p => console.log(' ', p.name, p.collection_id));
}

checkAlford().catch(console.error);