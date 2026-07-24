const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // Try to run the ALTER TABLE using a raw SQL query through the REST API
  // We can't run DDL directly, but we can check if we need to add the column
  // and add it via the dashboard or supabase CLI
  
  // First, let's verify the product exists
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, article_no')
    .eq('article_no', '145144')
    .single();
  
  console.log('Product:', product);
  
  // Now try to update with categories (will fail if column doesn't exist)
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ 
      categories: ['Dining Room', 'Bar and Counter Table'] 
    })
    .eq('article_no', '145144')
    .select();
  
  console.log('Update result:', updated);
  console.log('Update error:', updateError);
  
  // Also try to update colors (should work since column exists)
  const { data: colorUpdated, error: colorError } = await supabase
    .from('products')
    .update({ 
      colors: [
        {'code': '1802', 'name': 'LIGHT TENNESSEE WALNUT', 'hex': '#8B7355', 'part': 'table_leg'},
        {'code': '1802', 'name': 'LIGHT TENNESSEE WALNUT', 'hex': '#8B7355', 'part': 'table_top'}
      ] 
    })
    .eq('article_no', '145144')
    .select();
  
  console.log('Color update result:', colorUpdated);
  console.log('Color update error:', colorError);
}

run().catch(console.error);
