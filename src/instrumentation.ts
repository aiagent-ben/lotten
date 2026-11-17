export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.VITEST) return;

  const { bootstrapI18nRuntime } = await import('@/lib/i18n/bootstrap');
  await bootstrapI18nRuntime();
}
