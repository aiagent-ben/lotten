import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = '${NEXT_PUBLIC_SUPABASE_URL}';
const serviceRoleKey = '${SUPABASE_SERVICE_ROLE_KEY}';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeMigration() {
  console.log('Reading migration file...');
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Executing ${statements.length} SQL statements via REST API...`);
  
  // Use Supabase's SQL execution endpoint
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt.trim()) continue;
    
    try {
      // Execute raw SQL via the pg_metaschema or direct query
      // We'll use the REST API with a special query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql: stmt + ';' })
      });
      
      if (!response.ok) {
        const text = await response.text();
        // Try alternative: direct SQL execution
        console.log(`Statement ${i + 1}: RPC failed, trying alternative...`);
        
        // For DDL statements, we might need to use a different approach
        // Let's try using the pgadmin-style query endpoint
      } else {
        console.log(`Statement ${i + 1}: OK`);
      }
    } catch (err: unknown) {
      console.error(`Statement ${i + 1} error:`, (err as Error).message?.substring(0, 200));
    }
  }
  
  console.log('Migration execution attempted. Checking tables...');
  await verifyTables();
}

async function verifyTables() {
  const tables = ['brands', 'collections', 'products', 'product_images', 'product_variants', 
                  'customers', 'orders', 'order_items', 'discount_codes', 'site_settings',
                  'search_analytics', 'order_analytics'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: NOT FOUND - ${error.message}`);
    } else {
      console.log(`Table ${table}: EXISTS (${data?.length || 0} rows)`);
    }
  }
}

executeMigration().catch(console.error);