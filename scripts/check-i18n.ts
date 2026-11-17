#!/usr/bin/env tsx
// Focused storefront i18n completeness audit:
// 1. Ensures no storefront file under `src/app/[locale]/**` or `src/components/**`
//    (excluding `src/components/admin/**` and `src/components/ui/**`) imports raw
//    `next/link` or `useRouter`/`usePathname`/`redirect` from `next/navigation`.
// 2. Ensures every `src/app/[locale]/**/page.tsx` calls `setRequestLocale`.
// 3. Scans JSX text nodes and UI attributes (`placeholder`, `title`, `alt`,
//    `aria-label`) via TypeScript AST to flag remaining hardcoded English copy.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SCAN_DIRS = [
  path.join(ROOT, 'src/app/[locale]'),
  path.join(ROOT, 'src/components'),
];

const EXCLUDED_FILES = new Set([
  'src/app/[locale]/products/alford-test/page.tsx', // static fixture demo page
  'src/components/LocaleProvider.tsx',
  'src/components/Logo.tsx',
  'src/components/Recommendations.tsx', // unused dead component
  'src/components/RecommendationsCarousel.tsx', // unused dead component
]);

const UI_ATTRS = new Set(['placeholder', 'title', 'alt', 'aria-label', 'aria-description']);

// Intentional proper nouns / units / symbols allowed verbatim in JSX
const ALLOWED_JSX_TEXT = new Set([
  '/',
  '×',
  'mm',
  'in',
  'kg',
  'lbs',
  'm³ (CBM)',
  'Breda',
  'Dover',
  'Castor',
  'Luooma',
  'sales@lottenfurniture.com',
  '—',
]);

function walkTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin' || entry.name === 'ui') continue;
      results.push(...walkTsxFiles(full));
    } else if (
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      results.push(full);
    }
  }
  return results;
}

const errors: string[] = [];

for (const dir of SCAN_DIRS) {
  for (const filePath of walkTsxFiles(dir)) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    if (EXCLUDED_FILES.has(rel)) continue;

    const code = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);

    // 1. Check banned next/link & next/navigation routing imports
    sourceFile.forEachChild((node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const mod = node.moduleSpecifier.text;
        if (mod === 'next/link') {
          errors.push(`${rel}: imports Link from 'next/link' instead of '@/i18n/navigation'`);
        }
        if (mod === 'next/navigation' && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const el of node.importClause.namedBindings.elements) {
            const name = el.name.text;
            if (name === 'useRouter' || name === 'usePathname' || name === 'redirect') {
              errors.push(`${rel}: imports ${name} from 'next/navigation' instead of '@/i18n/navigation'`);
            }
          }
        }
      }
    });

    // 2. Ensure every page.tsx calls setRequestLocale
    if (rel.startsWith('src/app/[locale]/') && rel.endsWith('/page.tsx')) {
      if (!code.includes('setRequestLocale(')) {
        errors.push(`${rel}: missing setRequestLocale(locale) call`);
      }
    }

    // 3. Walk JSX for hardcoded text & UI attributes
    function visit(node: ts.Node) {
      if (ts.isJsxText(node)) {
        const trimmed = node.getText(sourceFile).replace(/\s+/g, ' ').trim();
        const withoutEntities = trimmed.replace(/&[a-zA-Z0-9#]+;/g, ' ').trim();
        if (
          withoutEntities &&
          !ALLOWED_JSX_TEXT.has(trimmed) &&
          /[A-Za-z]{2,}/.test(withoutEntities)
        ) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          errors.push(`${rel}:${pos.line + 1}: hardcoded JsxText "${trimmed}"`);
        }
      } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
        const attrName = node.name.text;
        if (UI_ATTRS.has(attrName) && node.initializer && ts.isStringLiteral(node.initializer)) {
          const val = node.initializer.text.trim();
          if (val && val !== 'Facebook' && /[A-Za-z]{2,}/.test(val)) {
            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            errors.push(`${rel}:${pos.line + 1}: hardcoded ${attrName}="${val}"`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
}

if (errors.length > 0) {
  console.error(`i18n audit failed with ${errors.length} issue(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('i18n audit passed: 0 raw routing imports, 0 missing setRequestLocale, 0 hardcoded JSX strings.');
