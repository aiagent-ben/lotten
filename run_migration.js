require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract database URL from Supabase URL
// Format: https://xxxxx.supabase.co -> postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
// We need the actual database connection string which usually contains the service key

// For Supabase, the connection string is typically:
// postgresql://postgres:[SERVICE_ROLE_KEY]@db.[PROJECT_REF].supabase.co:5432/postgres

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
console.log('Project ref:', projectRef);

const connectionString = `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS categories TEXT[];
      CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN (categories);
    `);
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
