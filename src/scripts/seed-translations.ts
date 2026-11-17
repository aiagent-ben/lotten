#!/usr/bin/env tsx
/**
 * Backfill / seed starter Bahasa Melayu (`my`) and Simplified Chinese (`zh`)
 * translations into Supabase `translations` JSONB columns without overwriting
 * existing manually curated translations.
 *
 * Usage:
 *   npx tsx src/scripts/seed-translations.ts
 *   ENV_FILE=.env npx tsx src/scripts/seed-translations.ts
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
  const { seedCatalogTranslations } = await import('@/lib/i18n/seed');
  console.log(`Target Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '(unset)'}`);
  const result = await seedCatalogTranslations();
  console.log(
    `Updated ${result.brandsUpdated}/${result.totalBrands} brands, ` +
      `${result.collectionsUpdated}/${result.totalCollections} collections, ` +
      `${result.productsUpdated}/${result.totalProducts} products.`
  );
}

main().catch((err) => {
  console.error('Failed to seed translations:', err);
  process.exit(1);
});
