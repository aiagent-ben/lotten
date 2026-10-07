import { describe, expect, it } from 'vitest';
import { sanitizePostgrestSearch } from './sanitize';

describe('sanitizePostgrestSearch', () => {
  it('returns empty string for empty or falsy inputs', () => {
    expect(sanitizePostgrestSearch('')).toBe('');
    expect(sanitizePostgrestSearch('   ')).toBe('');
  });

  it('preserves alphanumeric words', () => {
    expect(sanitizePostgrestSearch('Oak Dining Table')).toBe('Oak Dining Table');
    expect(sanitizePostgrestSearch('SKU-12345')).toBe('SKU-12345');
  });

  it('neutralizes PostgREST filter injection with commas and parentheses', () => {
    const malicious = 'test),is_active.is.true,(email.ilike.%';
    const sanitized = sanitizePostgrestSearch(malicious);
    expect(sanitized).not.toContain(',');
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
    expect(sanitized).toBe('test is\\_active.is.true email.ilike.\\%');
  });

  it('escapes SQL ILIKE wildcards (%, _) and backslashes', () => {
    const input = '50%_discount\\deal';
    const sanitized = sanitizePostgrestSearch(input);
    expect(sanitized).toBe('50\\%\\_discount\\\\deal');
  });

  it('collapses excessive whitespace after removing punctuation', () => {
    const input = 'sofa (leather, brown)';
    const sanitized = sanitizePostgrestSearch(input);
    expect(sanitized).toBe('sofa leather brown');
  });
});
