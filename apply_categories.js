require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigration() {
  const response = await fetch(supabaseUrl + '/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + supabaseServiceKey,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({
      sql: `
        ALTER TABLE products ADD COLUMN IF NOT EXISTS categories TEXT[];
        CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN (categories);
      `
    })
  });
  
  console.log('Response:', response.status, await response.text());
}

applyMigration().catch(console.error);
