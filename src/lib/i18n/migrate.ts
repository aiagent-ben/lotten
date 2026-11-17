import { Client } from 'pg';

const TRANSLATION_TABLES = [
  'brands',
  'collections',
  'products',
  'product_variants',
  'content_pages',
  'content_categories',
] as const;

const MIGRATION_VERSION = '20261117000000';
const ROLLOUT_COMPLETE_VERSION = '20261117000000_i18n_rollout';
const ADVISORY_LOCK_ID = 84729103;

export interface MigrationResult {
  applied: boolean;
  rolloutAlreadyComplete: boolean;
  addedTables: string[];
  skippedReason?: string;
}

function attachClientErrorHandler(client: Client) {
  client.on('error', (err) => {
    console.error('[i18n-bootstrap] pg client error:', err.message);
  });
}

async function connectWithSslFallback(connectionString: string): Promise<Client> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 8000,
  });
  attachClientErrorHandler(client);

  try {
    await client.connect();
    return client;
  } catch (err) {
    await client.end().catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    if (!/pg_hba\.conf|ssl/i.test(msg)) {
      throw err;
    }

    const sslClient = new Client({
      connectionString,
      connectionTimeoutMillis: 8000,
      ssl: { rejectUnauthorized: false },
    });
    attachClientErrorHandler(sslClient);
    await sslClient.connect();
    return sslClient;
  }
}

async function checkRolloutCompleteMarker(client: Client): Promise<boolean> {
  try {
    const { rows } = await client.query<{ version: string }>(
      `SELECT version FROM supabase_migrations.schema_migrations WHERE version = $1 LIMIT 1`,
      [ROLLOUT_COMPLETE_VERSION]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Ensures the `translations JSONB` columns from `20261117000000_add_i18n_translations.sql`
 * exist in Postgres when `DATABASE_URL` is configured, and checks whether the full
 * initial i18n rollout marker is already recorded.
 */
export async function ensureI18nSchema(): Promise<MigrationResult> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return {
      applied: false,
      rolloutAlreadyComplete: false,
      addedTables: [],
      skippedReason: 'DATABASE_URL not set',
    };
  }

  const client = await connectWithSslFallback(connectionString);

  try {
    await client.query("SET lock_timeout = '5s'; SET statement_timeout = '15s'");
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);

    try {
      const rolloutAlreadyComplete = await checkRolloutCompleteMarker(client);

      const { rows: existingCols } = await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND column_name = 'translations'
           AND table_name = ANY($1::text[])`,
        [TRANSLATION_TABLES]
      );

      const existingSet = new Set(existingCols.map((r) => r.table_name));
      const missingTables = TRANSLATION_TABLES.filter((t) => !existingSet.has(t));

      if (missingTables.length === 0 && rolloutAlreadyComplete) {
        return {
          applied: false,
          rolloutAlreadyComplete: true,
          addedTables: [],
        };
      }

      if (missingTables.length > 0) {
        for (const table of missingTables) {
          await client.query(
            `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`
          );
        }

        try {
          await client.query(
            `INSERT INTO supabase_migrations.schema_migrations (version)
             VALUES ($1)
             ON CONFLICT (version) DO NOTHING`,
            [MIGRATION_VERSION]
          );
        } catch {
          // Non-fatal if supabase_migrations schema is absent or differs
        }

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log(`[i18n-bootstrap] Added translations column to: ${missingTables.join(', ')}`);
      }

      return {
        applied: missingTables.length > 0,
        rolloutAlreadyComplete,
        addedTables: [...missingTables],
      };
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]).catch(() => {});
    }
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Records completion of initial i18n rollout (migration + starter seed + Meilisearch sync)
 * so subsequent container boots skip re-seeding and unconditional Meilisearch rebuilds.
 */
export async function markI18nRolloutComplete(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return;

  const client = await connectWithSslFallback(connectionString);
  try {
    await client.query(
      `INSERT INTO supabase_migrations.schema_migrations (version)
       VALUES ($1)
       ON CONFLICT (version) DO NOTHING`,
      [ROLLOUT_COMPLETE_VERSION]
    );
  } catch (err) {
    console.warn('[i18n-bootstrap] Could not record rollout marker:', err);
  } finally {
    await client.end().catch(() => {});
  }
}
