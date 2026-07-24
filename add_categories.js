const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // Query a product to see its columns
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('article_no', '145144')
    .single();
  
  console.log('Product columns:', Object.keys(product || {}).join(', '));
  console.log('Error:', error);
}

run().catch(console.error);
