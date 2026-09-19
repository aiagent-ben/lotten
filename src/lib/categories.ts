import { CANONICAL_CATEGORIES } from './constants/categories';

/**
 * Strips HTML tags, script blocks, and harmful characters from free-form text.
 */
function sanitizeTag(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove script tags + content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // remove style tags + content
    .replace(/<[^>]+>/g, '') // remove any remaining HTML tags
    .replace(/[^\w\s&'-]/g, '') // keep alphanumeric, spaces, &, ', -
    .trim();
}

/**
 * Matches an input string against canonical category names, slugs, and aliases.
 * Returns the exact canonical name if matched, or the sanitized trimmed string.
 */
export function matchCanonicalCategory(input: string): string {
  const sanitized = sanitizeTag(input);
  if (!sanitized) return '';

  const lower = sanitized.toLowerCase();
  const found = CANONICAL_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.slug.toLowerCase() === lower ||
      c.aliases?.some((alias) => alias.toLowerCase() === lower)
  );

  if (found) {
    return found.name;
  }

  return sanitized;
}

/**
 * Normalizes, sanitizes, and deduplicates an array of category tags.
 * Safe for database insertion as Postgres TEXT[].
 */
export function normalizeCategories(raw: unknown): string[] {
  if (!raw) return [];

  let items: string[] = [];

  if (Array.isArray(raw)) {
    items = raw
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
      .filter(Boolean);
  } else if (typeof raw === 'string') {
    // Support comma-separated strings if passed
    items = raw.split(',').map((s) => s.trim());
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const cleaned = matchCanonicalCategory(item);
    if (!cleaned) continue;

    const lowerKey = cleaned.toLowerCase();
    if (!seen.has(lowerKey)) {
      seen.add(lowerKey);
      result.push(cleaned);
    }
  }

  return result;
}
