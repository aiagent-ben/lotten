import { describe, expect, it } from 'vitest';
import { matchCanonicalCategory, normalizeCategories } from './categories';

describe('categories helpers', () => {
  describe('matchCanonicalCategory', () => {
    it('Happy path: returns canonical name when given exact match', () => {
      expect(matchCanonicalCategory('Dining Table')).toBe('Dining Table');
      expect(matchCanonicalCategory('Living Room')).toBe('Living Room');
    });

    it('Happy path: matches slug or case-insensitive variant to canonical name', () => {
      expect(matchCanonicalCategory('sofa-armchair')).toBe('Sofa & Armchair');
      expect(matchCanonicalCategory('SOFA & ARMCHAIR')).toBe('Sofa & Armchair');
      expect(matchCanonicalCategory('dining-room')).toBe('Dining Room');
      expect(matchCanonicalCategory('mattress')).toBe('Mattress');
    });

    it('Happy path: preserves custom non-canonical tags cleanly', () => {
      expect(matchCanonicalCategory('Solid Oak')).toBe('Solid Oak');
      expect(matchCanonicalCategory('Mid-Century Modern')).toBe('Mid-Century Modern');
    });

    it('Sad / Edge: strips HTML tags and scripts from custom input', () => {
      expect(matchCanonicalCategory('<script>alert("hack")</script>Sofa')).toBe('Sofa & Armchair');
      expect(matchCanonicalCategory('<b>Luxury</b>')).toBe('Luxury');
    });

    it('Edge case: empty string or whitespace returns empty', () => {
      expect(matchCanonicalCategory('')).toBe('');
      expect(matchCanonicalCategory('    ')).toBe('');
    });
  });

  describe('normalizeCategories', () => {
    it('Happy path: normalizes array of valid categories', () => {
      const input = ['Living Room', 'sofa-armchair', 'Solid Wood'];
      const result = normalizeCategories(input);
      expect(result).toEqual(['Living Room', 'Sofa & Armchair', 'Solid Wood']);
    });

    it('Happy path: supports comma-separated string input', () => {
      const input = 'Dining Room, dining-table, Oak';
      const result = normalizeCategories(input);
      expect(result).toEqual(['Dining Room', 'Dining Table', 'Oak']);
    });

    it('Sad path: handles null, undefined, or empty values safely', () => {
      expect(normalizeCategories(null)).toEqual([]);
      expect(normalizeCategories(undefined)).toEqual([]);
      expect(normalizeCategories('')).toEqual([]);
      expect(normalizeCategories([])).toEqual([]);
    });

    it('Edge case: deduplicates case-insensitively', () => {
      const input = ['Mattress', 'mattress', 'MATTRESS'];
      const result = normalizeCategories(input);
      expect(result).toEqual(['Mattress']);
    });

    it('Edge case: filters out empty strings and whitespace-only entries', () => {
      const input = [' ', '', 'TV Cabinet', '   ', 'Living Room'];
      const result = normalizeCategories(input);
      expect(result).toEqual(['TV Cabinet', 'Living Room']);
    });

    it('Edge case: handles non-string elements inside array gracefully', () => {
      const input = ['Sofa', 123, null, undefined, false] as any;
      const result = normalizeCategories(input);
      expect(result).toEqual(['Sofa & Armchair', '123', 'false']);
    });
  });
});
