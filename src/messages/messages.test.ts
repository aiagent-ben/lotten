import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type JsonRecord = Record<string, unknown>;

const MESSAGES_DIR = path.resolve(process.cwd(), 'src/messages');
const LOCALES = ['en', 'my', 'zh'] as const;

// Terms that are intentionally identical across languages (proper nouns / abbreviations)
const SHARED_VALUE_ALLOWLIST = new Set([
  'common.blog',
  'common.lookbooks',
  'nav.lookbooks',
  'footer.lookbooks',
  'home.type_lookbook',
  'home.collections_badge',
  'contact.building',
  'contact.location',
  'contact.visit_note',
  'product.moq_label',
  'product.unit_singular',
  'blog.meta_title',
  'search.min',
  'materials.parts.panel',
]);

function flattenEntries(obj: JsonRecord, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out.set(fullKey, v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [ck, cv] of flattenEntries(v as JsonRecord, fullKey)) {
        out.set(ck, cv);
      }
    }
  }
  return out;
}

function extractPlaceholders(value: string): string[] {
  const matches = value.match(/\{([a-zA-Z0-9_]+)(?:,[^}]*)?\}/g) || [];
  return matches
    .map((m) => {
      const nameMatch = m.match(/^\{([a-zA-Z0-9_]+)/);
      return nameMatch ? nameMatch[1] : '';
    })
    .filter(Boolean)
    .sort();
}

/**
 * Detect duplicate keys at the same object nesting level in raw JSON source.
 */
function findDuplicateJsonKeys(raw: string): string[] {
  const duplicates: string[] = [];
  const stack: Set<string>[] = [];
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '{') {
      stack.push(new Set<string>());
      i++;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      i++;
      continue;
    }
    if (ch === '"') {
      // Parse string literal
      let end = i + 1;
      while (end < raw.length) {
        if (raw[end] === '\\') {
          end += 2;
        } else if (raw[end] === '"') {
          break;
        } else {
          end++;
        }
      }
      const str = JSON.parse(raw.slice(i, end + 1)) as string;
      // Check if followed by ':' (making it an object property key)
      let j = end + 1;
      while (j < raw.length && /\s/.test(raw[j])) j++;
      if (raw[j] === ':' && stack.length > 0) {
        const currentScope = stack[stack.length - 1];
        if (currentScope.has(str)) {
          duplicates.push(str);
        } else {
          currentScope.add(str);
        }
      }
      i = end + 1;
      continue;
    }
    i++;
  }
  return duplicates;
}

describe('i18n message dictionaries', () => {
  const rawByLocale = Object.fromEntries(
    LOCALES.map((loc) => [loc, fs.readFileSync(path.join(MESSAGES_DIR, `${loc}.json`), 'utf-8')])
  ) as Record<(typeof LOCALES)[number], string>;

  const flatByLocale = Object.fromEntries(
    LOCALES.map((loc) => [loc, flattenEntries(JSON.parse(rawByLocale[loc]) as JsonRecord)])
  ) as Record<(typeof LOCALES)[number], Map<string, string>>;

  it('has zero duplicate keys in en.json, my.json, and zh.json', () => {
    for (const loc of LOCALES) {
      expect(findDuplicateJsonKeys(rawByLocale[loc])).toEqual([]);
    }
  });

  it('has 100% key-tree parity between en.json, my.json, and zh.json', () => {
    const enKeys = Array.from(flatByLocale.en.keys()).sort();
    const myKeys = Array.from(flatByLocale.my.keys()).sort();
    const zhKeys = Array.from(flatByLocale.zh.keys()).sort();

    expect(myKeys).toEqual(enKeys);
    expect(zhKeys).toEqual(enKeys);
  });

  it('has matching ICU placeholders across all locales', () => {
    for (const [key, enVal] of flatByLocale.en.entries()) {
      const enVars = extractPlaceholders(enVal);
      for (const loc of ['my', 'zh'] as const) {
        const val = flatByLocale[loc].get(key) || '';
        expect(extractPlaceholders(val), `${loc}.${key} placeholder mismatch`).toEqual(enVars);
      }
    }
  });

  it('contains no untranslated English fallback strings in my.json or zh.json', () => {
    const sameInMy: string[] = [];
    const sameInZh: string[] = [];

    for (const [key, enVal] of flatByLocale.en.entries()) {
      if (SHARED_VALUE_ALLOWLIST.has(key)) continue;
      // Skip proper brand/material identifiers where spelling is intentionally identical
      if (enVal === 'MDF' || enVal === 'Walnut' || enVal === 'Oak' || enVal === 'Espresso' || enVal === 'Matte') {
        continue;
      }

      if (flatByLocale.my.get(key) === enVal) {
        sameInMy.push(`${key}="${enVal}"`);
      }
      if (flatByLocale.zh.get(key) === enVal) {
        sameInZh.push(`${key}="${enVal}"`);
      }
    }

    expect(sameInMy).toEqual([]);
    expect(sameInZh).toEqual([]);
  });

  it('contains Chinese characters in zh.json (not misplaced Malay)', () => {
    const title = flatByLocale.zh.get('home.hero_title_line1') || '';
    expect(/[\u4e00-\u9fff]/.test(title)).toBe(true);
  });
});
