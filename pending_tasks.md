# Pending Tasks — lotten.2share.tech Audit

> Generated: 2026-07-21 | Source: Automated crawl of all public routes + source code inspection
> Reviewed: 2026-07-21 | Critic pass added inline as `> 🧭 Critic:` blocks under each item

## Summary

| Category | Count |
|----------|-------|
| 🔴 Broken pages (500 errors) | 5 |
| 🔴 Broken pages (404 dead links) | 8 |
| 🟡 Empty content (no seeded data) | 3 |
| 🟡 Missing favicon assets | 1 |
| 🟢 Locale-redirect inefficiency | All nav links |

---

## 1. 🔴 /en/products → 500 Internal Server Error

**Routes affected:**
- `/en/products`
- `/en/products?collection=breda`
- `/en/products?category=new`
- `/en/products?category=bestseller`

**Root cause:** `src/app/[locale]/products/page.tsx` is a Server Component (no `"use client"`), but it renders `<select>` elements with inline `onChange` handlers that call `window.location.href`:
```tsx
// Lines 110-118, 150-158, 174-182
onChange={(e) => {
  const url = new URL(window.location.href);  // ❌ window undefined on server
  ...
  window.location.href = url.toString();
}}
```
React Server Components cannot reference `window` — hydration throws at render.

**Fix:** Move the filter/sort UI into a Client Component (e.g., `ProductsPageClient.tsx` already exists but is only used for "Recently Viewed"). Either:
- Create a `<ProductFilters>` client component that wraps the 3 `<select>` elements, OR
- Convert the entire toolbar to the existing `ProductsPageClient` and pass `searchParams` as props.

**Files:** `src/app/[locale]/products/page.tsx` (remove inline handlers), new or updated `src/app/[locale]/products/ProductsPageClient.tsx` (add filter UI).

> 🧭 **Critic:** Agreement on root cause. Recommended fix is **option 1 (extract a `<ProductFilters>` client component)**, not option 2. Reason: the products page does heavy work server-side (filtering, sorting, pagination) that must stay in RSC for SEO and ISR. Only the select elements need interactivity. Treat `ProductsPageClient.tsx` as a candidate for renaming or splitting — currently it only renders the RecentlyViewed carousel; overloading it with filter state is a smell. Concrete plan:
>   - Create `src/app/[locale]/products/ProductFilters.tsx` (`"use client"`). Three uncontrolled `<select>` elements; on `onChange`, push the new query string via `useRouter().push()` + `useSearchParams()`. This is the Next.js 16 idiomatic shape and avoids `window.location` entirely.
>   - Server page passes the current `searchParams` values down as props.
>   - Keep pagination/filter/sort logic in the Server Component.
> Caveat to verify during fix: `searchParams` in Next.js 16 must be awaited (`await searchParams`) — confirm the prop type matches that async-owned shape already used on line 16.

> ** User comments ** 
> - Good critic. Go ahead and implement the fixes.

> ✅ **COMPLETED** — Created `src/app/[locale]/products/ProductFilters.tsx` client component; replaced inline handlers in `page.tsx` with `<ProductFilters collectionFilter={collectionFilter} categoryFilter={categoryFilter} sortFilter={sortFilter} />`. Build + typecheck pass.

---

## 2. 🔴 /en/checkout → 500 Internal Server Error

**Route:** `/en/checkout`

**Root cause:** `src/app/[locale]/checkout/CheckoutPageClient.tsx` line 7 imports:
```tsx
import { useCart } from "@/components/CartDrawer";
```
But `src/app/[locale]/layout.tsx` wraps the tree in `<CartProvider>` from `@/components/CartProvider` (the new localStorage-backed provider). `CartDrawer.tsx` exports its OWN `CartProvider` + `CartContext` — a *different* context from the one wrapping the tree. So `useCart()` from `CartDrawer` finds no matching provider and the component errors during render.

**Fix:** Change the import in `CheckoutPageClient.tsx` to:
```tsx
import { useCart } from "@/components/CartProvider";
```
Then verify the cart item shape matches what the checkout page expects (both should expose `items`, `subtotal`, `itemCount`, `closeCart` — they do).

**Files:** `src/app/[locale]/checkout/CheckoutPageClient.tsx` line 7.

> 🧭 **Critic:** Root cause confirmed, fix is correct and minimal. But the situation points to a **deeper inconsistency that must be resolved at the same time** or it'll bite again:
>   - Two CartProvider implementations coexist (`@/components/CartDrawer.tsx` exports its own `CartProvider`/`CartContext`; `@/components/CartProvider.tsx` exports a separate one). The layout uses the new CartProvider, but `CartDrawer.tsx` still exports everything and is referenced by checkout. One provider will become orphaned dead code.
>   - **CartDrawer.tsx** uses `fetch('/api/cart')` Server Actions; **CartProvider.tsx** uses `localStorage`. These produce *different source-of-truth*. The checkout page reads from one (`CartProvider` after the fix), the drawer UI lives inside the layout's `<CartProvider>`, but `/api/checkout` (route.ts) only inspects the **cookie** (`getCartFromCookie` reads `cookies()`). Result: cart items may never reach the server-side checkout API.
> Recommended fix:
>   1. Change checkout import → `useCart` from `@/components/CartProvider` (the reported fix).
>   2. Walk through a "add to cart → checkout → place order" flow end-to-end. If cart state lives only in localStorage and the API reads cookies, items won't reach `/api/checkout`. Resolve by either (a) making CartProvider sync to the `lotten_cart` cookie via `setCookie` on every change, or (b) having `/api/checkout` read items from the request body only (which it already does — the client `POST`s `items` in body). Verify option (b) actually wires through; it probably does, so (a) is unnecessary. Test, don't assume.
>   3. Audit and remove the dead `CartDrawer.tsx` CartProvider / useCart export after migration — keep only the cart *drawer UI* if anything.
> Also: the `mergeCartOnLogin` Server Action in `cart.ts` queries a `carts` table that **does not exist** in `001_initial_schema.sql`. That's a latent bug, not blocking for anonymous checkout, but flag it.

> ** User comments **
> - there are no user profile creation, so there will be no checkout and no carts. remove all redundant or dead code.

> ✅ **COMPLETED** — Deleted `src/app/[locale]/checkout`, `src/app/api/checkout`, `src/app/api/cart`, `src/lib/actions/cart.ts`, `src/components/CartProvider.tsx`, `src/components/CartDrawer.tsx` via `git rm`. Removed `CartProvider` import + wrapper from `[locale]/layout.tsx`. Removed dead cart icon/button from `[locale]/page.tsx` nav. Build + typecheck pass.

---

## 3. 🔴 Dead Link: /collections/undefined from Product Detail

**Route:** Links from `/en/products/[slug]` → `/en/collections/undefined` (404 in crawl)

**Root cause:** `src/app/[locale]/products/[slug]/ProductDetailClient.tsx` line 7:
```tsx
import {
  getAllActiveProducts,
  getCollectionBySlug,
  ...
  getCollectionBySlug as getCollection,  // ❌ aliased as getCollection
  ...
} from "@/lib/data/products";
```
Line 83 then calls `getCollection(product.collection_id)` — but `getCollectionBySlug` matches on the `slug` field, not `id`. Passing `collection_id` (e.g., `"col-breda"`) returns `undefined`, so `<Link href={`/collections/${collection.slug}`}>` renders `/collections/undefined`.

**Fix:** Import `getCollectionById` (which exists in `lib/data/products.ts` line 1055) instead:
```tsx
import { getCollectionById as getCollection } from "@/lib/data/products";
```
Or change the alias resolution so `getCollection(product.collection_id)` uses ID lookup.

**Files:** `src/app/[locale]/products/[slug]/ProductDetailClient.tsx` lines 7, 83 (and any other use of `getCollection`).

> 🧭 **Critic:** Root cause and fix are correct and minimal. One-line alias swap, no follow-up. No critique to add. Apply the fix, run `npx tsc --noEmit`, then verify a product page renders `/collections/breda` (not `/collections/undefined`) in the breadcrumb.
> Also worth doing during the same pass: audit the file for any other `getCollection(...)` calls that pass an ID — there are references at lines 559 (`collections/${collection?.slug}`) and via `getCollectionName(related.collection_id)`. The helper `getCollectionName` at line 659 uses a hardcoded `collectionsMap` keyed by ID — that one is fine and will keep working. Only the mis-aliased `getCollection` needs changing.

> ** User comments **
> - Good analysis. Perform the recommended changes.

> ✅ **COMPLETED** — Swapped `getCollectionBySlug as getCollection` → `getCollectionById as getCollection` in `ProductDetailClient.tsx` import. `npx tsc --noEmit` passes. Product detail page now renders `/collections/breda` (not `/collections/undefined`).

---

## 4. 🔴 Dead Footer/Nav Links (8 pages — all 404)

| Route | Source |
|-------|--------|
| `/en/about` | Footer "About Us", Nav "Our Story" |
| `/en/contact` | Footer "Contact Us", Nav "Contact" |
| `/en/faq` | Footer "FAQ" |
| `/en/shipping` | Footer "Shipping Info" |
| `/en/returns` | Footer "Returns" |
| `/en/sustainability` | Footer "Sustainability" |
| `/en/careers` | Footer "Careers" |
| `/en/press` | Footer "Press" |

**Root cause:** The layout/header/footer (rendered via `src/app/[locale]/page.tsx` or a shared layout) emits these links, but the `[locale]/[slug]` catch-all only serves entries from the `content_posts` table with `type='page'`. The footer links resolve to slugs like `about`, `contact`, etc. which don't exist as content rows — and there's no fallback page.

**Fix (pick one, matching site DNA):**
1. **Create stub pages** under `[locale]/{about,contact,faq,shipping,returns,...}/page.tsx` with real content, OR
2. **Seed `content_posts`** for these slugs from an MDX file / SQL migration, OR
3. **Remove the footer links** for pages with no content (simpler — recommended for "fully functional without dead links").

Given the SPEC defers Phase B customer features, the simplest viable path: create dedicated route files for the essential ones (`contact`, `about`, `faq`, `shipping`, `returns`) with placeholder content, and remove the rest (`sustainability`, `careers`, `press`) from the footer.

**Files:** `src/app/[locale]/{about,contact,faq,shipping,returns}/page.tsx` (new), and remove unused footer links from the footer component (source TBD — likely inline in `page.tsx` or a shared Footer component).

> 🧭 **Critic:** Plan source-claim corrected: **footer is inline in `src/app/[locale]/page.tsx` lines ~399-415**, not a shared component. There is no Footer.tsx — links live directly inside the home page Server Component. This has two consequences:
>   1. The footer links only show on the home page (other routes don't share it). Worth confirming by visiting `/en/products/breda-...` and checking if the footer appears there — if other pages render a different footer or none, the "dead links from every page" framing is wrong.
>   2. To remove links, edit inline in `page.tsx`. To **factor out a shared footer**, that's a larger refactor (extract to `components/Footer.tsx`, add to a parent layout). The audit's "remove from footer component" instruction is misleading given there is no footer component.
> Recommended fix:
>   - **Phase 1 (minimal, ships "no dead links"):** Create stub pages for `contact`, `about`, `faq`, `shipping`, `returns` with real placeholder copy. Remove `sustainability`, `careers`, `press` link entries from `page.tsx` footer inline. Don't extract a shared Footer component during this pass — that's a separate refactor.
>   - **Phase 2 (post-fix cleanup, optional):** Extract footer to `components/Footer.tsx` so it's reusable. Out of scope for this task; mention in a follow-up note only.
> Open question for the user: do you want real "About / Contact / FAQ / Shipping / Returns" content, or copy from a brief you provide? Without content, stub pages are honest placeholders (a contact form / business address) and still better than 404s. If you have branding info, share it; otherwise stubs will be written in the same Calm Editorial voice as the home page.

> ** User comments **
> Implement both phases fix. Generate real content for the links.

> ✅ **COMPLETED** — Created shared `src/components/Footer.tsx` (linked from `[locale]/layout.tsx`), removed inline footer from `[locale]/page.tsx`. Created 5 stub pages with real content: `[locale]/about`, `/contact`, `/faq`, `/shipping`, `/returns`. Removed `sustainability`, `careers`, `press` links from footer. Build + typecheck pass.

---

## 5. 🟡 Empty Content Hubs (no seeded data)

| Route | Status | Issue |
|-------|--------|-------|
| `/en/blog` | 200 | "No articles found" — 0 article links |
| `/en/guides` | 200 | 0 article links (only category filter links render) |
| `/en/lookbooks` | 200 | 0 article links (only room/style filter links render) |

**Root cause:** `src/lib/data/content.ts` reads from Supabase `content_posts` table. No seed migration inserts blog/guide/lookbook content. The MDX pipeline (`lib/mdx.ts`) expects content files or DB rows — none exist.

**Fix:** Either:
1. **Seed content** via a script/migration (insert 3-5 sample posts per type), OR
2. **Wire MDX file-based content** from `content/` directory (the `lib/mdx.ts` exists for this), OR
3. **Hide nav links** to `/blog`, `/guides`, `/lookbooks` until content exists.

For "fully functional without dead links" — these pages render successfully (200), just with empty state. Acceptable if we ensure the empty state is graceful (it is). But the nav should not advertise content that doesn't exist. Recommend either seeding 1-2 exemplar posts per section OR hiding nav links.

**Files:** `supabase/migrations/005_seed_content.sql` (new) OR content MDX files OR nav visibility changes.

> 🧭 **Critic:** Plan is technically correct but **the framing overstates severity**. These pages return 200 with a graceful empty state ("No articles found, try adjusting filters"). That is not a dead link — clicking `/blog` works. "Fully functional without dead links" is satisfied. Renaming this from "P1" to **P2 / nice-to-have** is more honest.
> Also verified: `[slug]/page.tsx` line 15 uses `getStaticParamsForType('page')` — confirms empty `content_posts` rows is the cause.
> Recommendation:
>   - **Do not** seed fake content via MDX/SQL just to fill pages — placeholder blog posts about furniture will look embarrassing.
>   - **Do** consider whether nav links to `/blog`, `/guides`, `/lookbooks` should be hidden in the header. They render via inline `<nav>` in `page.tsx` (similar to the footer). If blog/guides/lookbooks are not actively maintained, hiding them until launch is cleaner than promoting empty pages.
>   - If you want exemplar content, write *real* first posts: "Welcome to Lotten", "How to Care for Malaysian Oak", "Living Room Styling Tips" — 3 substantial articles. Then add 1 lookbook and 1 guide. Asking me to seed these is fine, but flag that someone needs to read/edit the prose, not just merge.
> Concretely: defer this item. Address after P0/P1 fixes. If you want content added now, say so explicitly with topics.

---

## 6. 🟡 Missing Favicon / Manifest Assets

**Route:** `/site.webmanifest` → 404

**Root cause:** `layout.tsx` line 55 references `manifest: "/site.webmanifest"` but the file doesn't exist in `public/`. Other favicon refs (`favicon-16x16.png`, `apple-touch-icon.png`) — unverified whether they exist.

**Fix:** Either:
1. Generate a `site.webmanifest` in `public/` with the icon set, OR
2. Remove the `manifest` line from layout metadata if no PWA is intended.

**Files:** `public/site.webmanifest` (new) OR `src/app/[locale]/layout.tsx` line 55.

> 🧭 **Critic:** Minimally verified: `favicon.ico` returns 200 from the live site (saw it in crawl), but `favicon-16x16.png` / `apple-touch-icon.png` / `site.webmanifest` are referenced but unverified. Most browsers tolerate missing manifests (silent 404 in the network tab) — impact is trivial, no visible UX break.
> Recommended fix (single option, no real choice to make here): create `public/site.webmanifest` listing the existing icons + a placeholder name/short_name. Takes ~2 minutes. Don't remove the manifest refs — the SEO metadata is there for a reason; just back it with a real file. Skip this if Out-Of-Scope萃/Phase D step, but if asked to ship "fully functional" this belongs in the same commit as P0 fixes for cleanliness.

---

## 7. 🟢 Locale-Prefix Redundancy (all navigation links)

**Observation:** Pages render links *without* the locale prefix (e.g. `/collections/breda`, `/products`, `/contact`). The middleware (line 13-18) redirects all locale-less URLs to `/${defaultLocale}${pathname}`. This works but causes an extra HTTP 307 round-trip on every link click.

**Impact:** Performance — every internal navigation triggers a redirect. Not a bug, but wasteful.

**Fix options:**
1. **Do nothing** — Next.js Link with i18n should resolve automatically; middleware redirect is a safety net. Acceptable.
2. **Update link generators** to include the active locale prefix from `usePathname()`/`params.locale` — cleaner, no redirect.

Recommended only if performance budget demands it. Not blocking for "fully functional".

**Files:** All `Link href="/..."` across the app — would need a `localePath()` helper.

> 🧭 **Critic:** This is outside "fully functional without dead links" scope — every link resolves correctly via middleware redirect, just with an extra round-trip. **Deferring this is correct.** Don't touch during this pass. Doing a global locale-prefix migration mid-bugfix would inflate the diff, risk introducing new broken links, and slow review. Note: the middleware redirect uses the default locale `en` unconditionally — for a real i18n setup with `zh`/`my` users, the redirect should detect `Accept-Language`. That's a separate i18n-polish task, not a dead-link issue.

> ** User comments **
> - Note this as deferred task in Phase X under spec.md
---

## 8. 🟢 Image Optimization — Verified Working

Initial crawl flagged `/_next/image?...&w=3840&q=75` as 400s. This was a **false positive** — the HTML-encoded `&` in the extracted href was passed literally. Re-testing with properly encoded single-`&` URLs returns 200 with optimized JPEG bytes (~6-8KB at w=640).

`next.config.ts` correctly allowlists both `mm.hinlim.com` (legacy scraped images) and `pub-...r2.dev` (R2 uploads). No action needed.

---

## 9. 🟢 Source Image Availability

| Source URL | Status |
|-----------|--------|
| `mm.hinlim.com/cache/b2bfs/product/{id}/{id}-550x500.jpg` | ✅ 200 (24-32KB each) |
| `mm.hinlim.com/cache/b2bfs/color/109 COCOA-30x30.jpg` | ❌ Connection refused (-1) |
| `mm.hinlim.com/cache/b2bfs/color/808 GOLD-30x30.jpg` | ❌ Connection refused (-1) |

**Note:** The color swatch images (30x30) consistently fail to load. These are used as small color-preview thumbnails. Likely the hinlim CDN blocks requests with this path shape, or the files require a different path/encoding.

**Fix:** Either:
1. Self-host color swatch images on R2 and update `colors[].hex`/image references, OR
2. Use CSS background-color from the `hex` field instead of `<img>` for swatches (the data already has hex codes — `#4A3728`, `#C5A050`, etc.).

**Files:** Color swatch rendering in `ProductDetailClient.tsx` (search for color rendering) and/or `collections/[slug]/page.tsx`. The raw `colors` JSONB already has `hex` values — switch to CSS background.

> 🧭 **Critic:** **Plan is incorrect.** Verified the actual source: `ProductDetailClient.tsx` line 283 already uses CSS `style={{ backgroundColor: color.hex || getColorHex(color.code) }}` for swatches — these are **not** the broken URLs.
> What's *actually* broken: the broken hinlim `color/{code} {NAME}-30x30.jpg` URLs (lines 476-477, 932-973 of `src/lib/data/products.ts`) are stored as **primary product images** in `images[].url` — i.e., they're the gallery thumbnails and main image for products like `prod-1` (Breda 1.5M TV Cabinet). Those ARE broken and will render broken `<Image>` placeholders on the product detail page.
> Also affects `hero_image_url` at line 194 (`color/808 GOLD-30x30.jpg`) — the **Royston collection**'s hero image is broken, visible at `/en/collections/royston`.
> Corrected recommended fix:
>   1. Replace the broken color URLs in `images[]` arrays in `src/lib/data/products.ts` with working product photos from `mm.hinlim.com/cache/b2bfs/product/{id}/{id}-550x500.jpg` — many of these already exist in the same file, just stitched into the wrong slot.
>   2. Fix `col-royston` `hero_image_url` to use a Royston product image (e.g. `345064`-based) instead of the broken gold swatch URL.
>   3. **Do NOT change `ProductDetailClient.tsx`** — it's already correct.
> Severity adjustment: this is actually **P1** (broken hero on Royston + broken primary images for ~10 products), not P2 as framed.

> ** User comments **
> Good analysis. Go ahead and fix.

> ✅ **COMPLETED** — Replaced broken `b2bfs/color/` URLs in `productImages` array with working `b2bfs/product/{article}/{article}-550x500.jpg` URLs mapped by `product_id` → `article_no`. Fixed `col-royston` `hero_image_url` to use `345064`-based image. Build + typecheck pass.
## Priority Order for Implementation (Revised by Critic)

> 🧭 **Critic:** The original priority list was directionally right but missed nuances. Updated below with adjusted priority and explicit "what to do" vs "what to defer" calls.

1. **P0 — Fix Products page 500s** (Section 1): extract `<ProductFilters>` client component. Affects 4 routes (the e-commerce spine).
2. **P0 — Fix Checkout 500** (Section 2): swap `useCart` import. **Then** smoke-test the full add-to-cart → checkout → place-order flow — if items don't reach the API, that's a follow-up cart-state P0 issue (flagged above).
3. **P0 — Fix `/collections/undefined` on product detail** (Section 3): one-line alias swap. Trivial.
4. **P0 — Fix the 5 broken footer/nav links** (Section 4): create stub pages for `contact`, `about`, `faq`, `shipping`, `returns`; remove `sustainability`, `careers`, `press` link entries from `page.tsx` inline footer. Don't extract shared Footer component in this pass.
5. **P1 — Broken hinlim color URLs used as product images + Royston hero** (Section 9, severity **upgraded**): silently broken hero on Royston + broken primary images for ~10 products. Replace with working `product/{id}/{id}-550x500.jpg` URLs in `src/lib/data/products.ts`. Do NOT touch `ProductDetailClient.tsx` swatches (already correct).
6. **P2 — `site.webmanifest` missing** (Section 6): trivial, include in the same commit as P0 fixes for hygiene.
7. **P2 — Empty content hubs** (Section 5, severity **downgraded**): defer. Pages return 200 with graceful empty state. Decide separately whether to write real articles or hide nav links; do NOT seed placeholder content.
8. **Defer — Locale-prefix redundancy** (Section 7): out of scope. Working today, just sub-optimal.
9. **Follow-up — Latent cart inconsistency** (Section 2 follow-up): dead `carts` table reference in `mergeCartOnLogin`. Not blocking anonymous checkout. File a separate task.

> **Practical note:** Items 1–4 + 6 fit in a single PR (~8–10 file changes). Item 5 is a static data change (`src/lib/data/products.ts`) — separate small PR or include if comfortable. Items 7–9 stay out of this iteration. If you authorize, the next step is implementing 1–6 in order with `npm run build` + `npx tsc --noEmit` after each step, ending with a full re-crawl to confirm 0 broken links on the live site.
