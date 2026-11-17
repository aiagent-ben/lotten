import { createServiceClient } from '@/lib/db/client';
import { ensureI18nSchema, markI18nRolloutComplete } from './migrate';
import { seedCatalogTranslations } from './seed';
import { syncAllProductsToMeilisearch } from '@/lib/search/reindex';

const GLOBAL_KEY = '__lottenI18nBootstrapStarted';

async function waitForPostgrestTranslationsColumn(maxWaitMs = 15000): Promise<boolean> {
  const supabase = createServiceClient();
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const { error } = await supabase.from('brands').select('translations').limit(1);
    if (!error) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return false;
}

async function triggerLocalCacheRevalidation() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return;

  const port = process.env.PORT || '3000';
  // Brief yield to ensure HTTP server is listening on localhost before calling internal endpoint
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/internal/revalidate-i18n`, {
      method: 'POST',
      headers: { 'x-internal-secret': serviceKey },
    });
    if (res.ok) {
      console.log('[i18n-bootstrap] Invalidated Next.js catalog/SSG caches.');
    } else {
      console.warn(`[i18n-bootstrap] Cache revalidation returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn('[i18n-bootstrap] Local cache revalidation skipped:', err);
  }
}

async function runInitialRollout(columnsWereJustAdded: boolean) {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  if (!hasSupabase) {
    console.log('[i18n-bootstrap] Supabase env not configured; skipping seed and search sync.');
    return;
  }

  const schemaReady = await waitForPostgrestTranslationsColumn(columnsWereJustAdded ? 15000 : 3000);
  if (!schemaReady) {
    console.error(
      '[i18n-bootstrap] PostgREST does not expose translations column yet; skipping seed and Meilisearch sync.'
    );
    return;
  }

  try {
    const seedRes = await seedCatalogTranslations();
    const totalUpdated =
      seedRes.brandsUpdated + seedRes.collectionsUpdated + seedRes.productsUpdated;
    if (totalUpdated > 0) {
      console.log(
        `[i18n-bootstrap] Seeded starter translations: ${seedRes.brandsUpdated} brands, ${seedRes.collectionsUpdated} collections, ${seedRes.productsUpdated} products.`
      );
    }

    const searchRes = await syncAllProductsToMeilisearch();
    if (searchRes.skippedReason) {
      console.log(`[i18n-bootstrap] Meilisearch sync skipped: ${searchRes.skippedReason}`);
    } else {
      console.log(
        `[i18n-bootstrap] Indexed ${searchRes.indexed} products (${searchRes.deleted} inactive removed) in Meilisearch.`
      );
    }

    await markI18nRolloutComplete();
    if (totalUpdated > 0 || columnsWereJustAdded) {
      await triggerLocalCacheRevalidation();
    }
  } catch (err) {
    console.error('[i18n-bootstrap] Initial rollout failed:', err);
  }
}

/**
 * Runs once per Node.js server boot:
 * 1. Awaits idempotent Postgres migration + rollout completion check inside pg_advisory_lock
 * 2. Fast-exits in ~2ms if `20261117000000_i18n_rollout` is already recorded
 * 3. Aborts cleanly if DB migration fails; otherwise completes starter seed + Meilisearch sync
 *    + cache revalidation without blocking HTTP listen.
 */
export async function bootstrapI18nRuntime(): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;

  let migration;
  try {
    migration = await ensureI18nSchema();
  } catch (err) {
    console.error('[i18n-bootstrap] DB migration failed; aborting seed and search sync:', err);
    return;
  }

  if (migration.skippedReason) {
    console.log(`[i18n-bootstrap] DB migration skipped: ${migration.skippedReason}`);
    return;
  }

  if (migration.rolloutAlreadyComplete) {
    console.log(
      '[i18n-bootstrap] i18n rollout already complete; skipping startup seed and full reindex.'
    );
    return;
  }

  void runInitialRollout(migration.applied);
}
