/**
 * Sanitizes user search terms for use in Supabase / PostgREST .or() filter strings.
 * 
 * PostgREST's filter grammar uses commas (`,`) and parentheses (`()`) as structural tokens.
 * Unsanitized user inputs containing these characters alter the filter tree or cause syntax errors.
 * Additionally, ILIKE wildcard characters (`%`, `_`, `\`) should be escaped to prevent unintended matching.
 */
export function sanitizePostgrestSearch(term: string): string {
  if (!term) return '';

  return term
    // Replace PostgREST structural grammar tokens with spaces so search terms don't break the query tree
    .replace(/[(),]/g, ' ')
    // Escape ILIKE wildcards and backslashes to treat them as literal characters
    .replace(/[\\%_]/g, '\\$&')
    // Collapse redundant whitespace and trim
    .replace(/\s+/g, ' ')
    .trim();
}
