#!/usr/bin/env tsx
/**
 * Full re-index of active products and localized translations into Meilisearch.
 *
 * Usage:
 *   npx tsx src/scripts/index-products-meilisearch.ts
 *   ENV_FILE=.env npx tsx src/scripts/index-products-meilisearch.ts
 */
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import { resolve } from 'node:path';

const requestedEnv = process.env.ENV_FILE?.trim();
const envPath = resolve(
  process.cwd(),
  requestedEnv || (fs.existsSync(resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env')
);
dotenv.config({ path: envPath });

async function main() {
  if (!process.env.MEILISEARCH_HOST?.trim()) {
    console.error('MEILISEARCH_HOST is not set. Aborting indexing.');
    process.exit(1);
  }

  const { syncAllProductsToMeilisearch } = await import('@/lib/search/reindex');
  console.log(`Target Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '(unset)'}`);
  console.log(`Target Meilisearch Host: ${process.env.MEILISEARCH_HOST}`);

  const result = await syncAllProductsToMeilisearch();
  console.log(
    `Indexing complete! Indexed ${result.indexed} active products, removed ${result.deleted} inactive.`
  );
}

main().catch((err) => {
  console.error('Error indexing products to Meilisearch:', err);
  process.exit(1);
});
