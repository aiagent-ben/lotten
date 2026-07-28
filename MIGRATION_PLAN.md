# Migration Plan: Fix Data Architecture

## Current State (Broken)
- **Parser** outputs `col-*` collection IDs (e.g., `col-alford`, `col-breda`)
- **Supabase** has UUID collection IDs (e.g., `60076cec-b361-4586-96c7-88aa87dd895b`)
- **App** (`lib/data/products.ts`) reads from `public/data/*.json` with `col-*` IDs
- **Images** served from R2 (good)
- **Result**: 0 products in collections because app's `getProductsByCollection('col-breda')` doesn't match DB's UUID collection IDs

## Correct Architecture
```
Scraper (scrape_comprehensive.py)
    → data/raw/scrapes/*.json
Parser (clean_products.py)
    → data/clean/products.json (with col-* collection_ids)
R2 Upload (upload_clean_to_r2.py)
    → data/clean/products_r2.json (with R2 URLs)
Seed (seed_one_time.py / seed-database.ts)
    → Reads clean JSON
    → Creates brands/collections with UUID IDs in Supabase
    → Maps col-* → UUID for each product
    → Seeds products with UUID collection_id
App (lib/data/products.ts)
    → Reads from Supabase via createServiceClient()
    → Images from R2
```

## Required Changes

### 1. Update `scripts/seed_one_time.py` (or `seed-database.ts`)
- Map `col-*` collection IDs from parser output to UUID collection IDs in Supabase
- Use deterministic UUID generation (uuid5) based on `col-*` string for consistency
- Create collections with proper UUID IDs before seeding products

### 2. Update `src/lib/data/products.ts` 
- Replace JSON file reading with Supabase queries
- Use `createServiceClient()` for server-side reads
- Functions: `getProducts()`, `getProduct()`, `getCollections()`, `getCollection()`

### 3. Update all pages using `@/lib/data/products`
- Already using async functions → just need data layer to hit Supabase
- Pages: `/products`, `/products/[slug]`, `/collections`, `/collections/[slug]`, `/`

### 4. Re-seed Database
- Clear existing bad data (products with UUID collection_ids that don't match parser's col-*)
- Re-run seed with proper mapping

### 5. Remove JSON file dependencies
- Remove `public/data/products.json`, `collections.json`, `brands.json` (or keep as backup)
- Update build to not require these files

## Verification Steps
1. Run seed script → verify 441 products seeded with correct UUID collection_ids
2. Build app → verify no TypeScript errors
3. Test collection pages → verify products appear (Breda=5, Castor=2, Alford=4)
4. Test product pages → verify images load from R2
5. Run full test suite

## Priority Order
1. Fix seed script mapping (critical - data integrity)
2. Update data layer to read from Supabase (critical - app reads wrong source)
3. Re-seed database (required for data correctness)
4. Build & test (verification)