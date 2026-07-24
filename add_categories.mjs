import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // First, let's check what columns exist in products
  const { data: cols, error: colsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'products')
    .eq('table_schema', 'public');
  
  console.log('Products columns:', cols?.map(c => c.column_name).join(', '));
  console.log('Error:', colsError);
}

run().catch(console.error);
