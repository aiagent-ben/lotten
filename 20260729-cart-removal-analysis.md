# Shopping Cart Removal Analysis — Lotten E-commerce

## Executive Summary

**Cart infrastructure is already removed from the frontend codebase.** The previous commit `3652cc0` (later reverted in `23d30f5`) deleted the `src/components/cart/` directory and removed the duplicate navigation from the home page. The current codebase has:

- ❌ No `CartProvider`, `CartDrawer`, or `useCart` components
- ❌ No `src/lib/actions/cart.ts` Server Actions
- ❌ No cart API routes (`/api/cart`, `/api/checkout`)
- ❌ No cart context or cookie sync logic

**What remains are references and infrastructure that would need cleanup** if the decision to remove cart is final.

---

## Current State Analysis

### 1. Frontend Codebase — Already Clean ✅

| Area | Status | Notes |
|------|--------|-------|
| `src/components/cart/` | **Deleted** (empty dir) | Was removed in `3652cc0` |
| `src/lib/actions/cart.ts` | **Deleted** | Was removed earlier |
| `src/app/api/cart/` | **Deleted** | Was removed earlier |
| `src/app/api/checkout/` | **Deleted** | Was removed earlier |
| `src/app/[locale]/checkout/` | **Does not exist** | Never implemented |
| `src/components/CartProvider.tsx` | **Deleted** | Was removed earlier |
| `src/components/CartDrawer.tsx` | **Deleted** | Was removed earlier |
| `CartContext` / `useCart` | **Not imported anywhere** | Verified via grep |

**Remaining UI references to clean:**
| File | Line | Reference | Action |
|------|------|-----------|--------|
| `src/app/[locale]/products/[slug]/ProductDetailClient.tsx` | 415 | Button text: `"Add to Cart"` | Change to `"Inquire"` or `"Request Quote"` |
| `src/app/admin/(admin)/layout.tsx` | 11, 23, 25 | `ShoppingCart` icon for Orders & Discounts nav | Replace with `Package` / `TicketPercent` icons |
| `src/app/admin/(admin)/page.tsx` | 115, 136 | Shopping cart icon for Orders stat card | Replace icon |

---

### 2. Database Schema — Partially Clean

**Current migration (`supabase/migrations/001_initial_schema.sql`):**
- ❌ **No `carts` table**
- ❌ **No `cart_items` table**
- ✅ Has `orders`, `order_items`, `customers` tables
- ✅ Has `discount_codes` table (used for promo codes, not cart-specific)

**SPEC.md references (outdated):**
> "The following tables exist in Supabase but are now unused: `carts`, `cart_items` — referenced in `mergeCartOnLogin` (deleted). These tables can be dropped in a future migration if desired."

**Action:** If cart tables exist in production Supabase, run a migration to drop them. If they only exist in SPEC.md as documentation debt, remove the references from SPEC.md.

---

### 3. Analytics & Event Tracking — Needs Cleanup

**File: `src/lib/analytics/engine.ts`**
```typescript
// Lines 46, 60, 75-79, 101, 124-149, 146-149, 162-165
eventType: 'view' | 'add_to_cart' | 'cart_view' | 'checkout_start' | 'order_complete'
```

**File: `src/lib/types/database.ts` (line 218)**
```typescript
export type OrderAnalyticsEventType = 
  'view' | 'add_to_cart' | 'checkout_start' | 'order_complete';
```

**Required changes:**
1. Remove `add_to_cart` and `cart_view` from `OrderAnalyticsEventType`
2. Remove cart funnel logic from `AnalyticsEngine.getConversionFunnel()` (lines 124-165)
3. Update `trackEvent()` calls throughout codebase to not send cart events

---

### 4. SPEC.md — Major Documentation Debt

The SPEC.md contains extensive cart-related content that is now **obsolete documentation debt**:

**Sections to remove/update:**
| Section | Lines | Action |
|---------|-------|--------|
| Phase B task table | 195-206 | Remove entire "Phase X: Cart, Checkout & Customer Features (Deferred)" section |
| B.1 Task Table | 867 | Remove `B8 Cart (Server Action + client state)` row |
| B.1 Task Table | 868-872 | Remove `B9 Checkout`, `B10 Discount validation`, `B11 Order email`, `B12 Customer auth`, `B13 Dashboard` |
| B.2 Key Decisions | 879-896 | Remove all cart/checkout decisions (Cart Persistence, Checkout Flow, Guest Checkout, Payment, Shipping, Tax, Stock Validation, MOQ, Discount Stacking, Cart Merge, Abandoned Cart, Shipping Regions, Tax Display, Order PDF, Wishlist Separate) |
| B.3 Dependency Graph | 901-906 | Remove cart → checkout → email → dashboard chain |
| B.4 Acceptance Criteria | 913-926 | Remove cart/checkout related criteria |
| B.5 Technical Approach | 932-933 | Remove Cart and Checkout approach notes |
| B.6 Open Questions | 944-950 | Remove all 5 questions |
| Phase C Decisions | 1005 | Remove "Wishlist Persistence" decision (depends on cart) |
| API Endpoints | 1191-1192 | Remove `POST /api/v1/cart` and `POST /api/v1/checkout` |
| Key Decisions Table | 1293 | Remove "Quote flow: Cart + checkout" decision |

**Estimated SPEC.md reduction:** ~150 lines of obsolete content

---

### 5. Supabase Migrations — May Need Cleanup

**Check production Supabase:**
```sql
-- Run in Supabase SQL editor to check
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('carts', 'cart_items');
```

If tables exist:
```sql
-- Migration to drop unused cart tables
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
-- Keep orders table for future inquiry/order tracking
```

**Also update `order_analytics` event_type constraint:**
```sql
ALTER TABLE order_analytics 
DROP CONSTRAINT IF EXISTS order_analytics_event_type_check;

ALTER TABLE order_analytics 
ADD CONSTRAINT order_analytics_event_type_check 
CHECK (event_type IN ('view', 'checkout_start', 'order_complete', 'search'));
```

---

### 6. Discount Codes — Decision Required

**Current state:** `discount_codes` table exists in schema and admin UI exists (`/admin/discounts`).

**Question:** Without cart/checkout, what happens to discount codes?

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **Keep discount codes** | Admin UI already built; useful for future inquiry/quote flow | Orphaned feature without checkout |
| **Remove discount codes** | Clean slate; no dead code | Waste of completed Phase A work |
| **Repurpose for inquiries** | Aligns with "no cart" model; discount on quote/invoice | Requires redesign |

**Recommendation:** Keep `discount_codes` table and admin UI, but rename to "Promotion Codes" and repurpose for future quote/invoice flow. Update SPEC.md accordingly.

---

### 7. Orders & Customers — Keep for Inquiry Flow

**Current schema has:**
- `customers` — keep (leads, inquiries, accounts)
- `orders` — rename concept to "Inquiries" or "Quotes"
- `order_items` → `inquiry_items`
- `order_analytics` → `inquiry_analytics`

**Rationale:** Even without cart/checkout, you need:
- Customer contact capture (inquiry forms)
- Product interest tracking (what they asked about)
- Quote/invoice generation (Phase B+)
- Admin order management (already built in `/admin/orders`)

---

## Required Changes Checklist

### Phase 1: Frontend Cleanup (Low Risk, ~30 min)
- [ ] `ProductDetailClient.tsx` line 415: Change "Add to Cart" → "Inquire" / "Request Quote"
- [ ] `admin/layout.tsx`: Replace `ShoppingCart` icons (lines 11, 23, 25)
- [ ] `admin/page.tsx`: Replace shopping cart icon (lines 115, 136)
- [ ] Verify no other "cart" strings in UI (search: `grep -ri "cart" src/app src/components`)

### Phase 2: Analytics Cleanup (Low Risk, ~30 min)
- [ ] `src/lib/types/database.ts`: Remove `add_to_cart`, `cart_view` from `OrderAnalyticsEventType`
- [ ] `src/lib/analytics/engine.ts`: Remove cart funnel logic (lines 124-165)
- [ ] Update `trackEvent` calls to not send removed event types

### Phase 3: SPEC.md Documentation Overhaul (Medium, ~1 hour)
- [ ] Remove entire "Phase X: Cart, Checkout & Customer Features (Deferred)" section (lines 195-206)
- [ ] Remove B8-B13 tasks from B.1 Task Table
- [ ] Remove all cart-related Key Decisions (B.2)
- [ ] Remove cart from Dependency Graph (B.3)
- [ ] Remove cart from Acceptance Criteria (B.4)
- [ ] Remove Cart/Checkout from Technical Approach (B.5)
- [ ] Remove Open Questions 1-5 (B.6)
- [ ] Remove Wishlist Persistence decision (C.2)
- [ ] Remove cart API endpoints (Section 7.1)
- [ ] Remove Quote flow decision (Key Decisions table)
- [ ] Update Phase B description to reflect "Inquiry/Quote" model instead of "Cart/Checkout"

### Phase 4: Database Migration (If Tables Exist in Production)
- [ ] Check Supabase for `carts`, `cart_items` tables
- [ ] If exist: create and run drop migration
- [ ] Update `order_analytics` event_type constraint
- [ ] Consider renaming `orders` → `inquiries` / `order_items` → `inquiry_items` (breaking change — defer to Phase B+)

### Phase 5: Discount Codes Decision
- [ ] Decide: Keep / Remove / Repurpose
- [ ] Update SPEC.md and admin nav accordingly

---

## Impact Assessment

| Area | Risk | Effort | Notes |
|------|------|--------|-------|
| Frontend UI | **None** | 30 min | Already cart-free |
| Analytics | Low | 30 min | Only internal tracking |
| SPEC.md | None | 1 hour | Documentation only |
| Database | **Medium** | 30 min | Only if tables exist in prod |
| Discount codes | **Decision needed** | Variable | Business decision required |
| Orders schema | **Defer** | — | Rename when inquiry flow built |

---

## Recommendation

**Proceed with Phases 1-3 immediately.** These are pure cleanup with zero functional risk.

**Defer Phase 4** until you confirm whether `carts`/`cart_items` tables actually exist in your Supabase project (they may not — the migration 001 doesn't create them).

**Decide Phase 5** (discount codes) with stakeholders before proceeding.

**Future Phase B scope change:** Rename "Phase B: Public Catalog + Cart/Checkout" → **"Phase B: Public Catalog + Inquiry/Quote Flow"**. The admin order management UI (`/admin/orders`) already exists and can be repurposed for inquiry management.

---

## Verification Commands

```bash
# Verify no cart imports remain
grep -r "cart" src/app src/components src/lib --include="*.tsx" --include="*.ts" | grep -v "carton" | grep -v "Carton"

# Verify no Cart context usage
grep -r "CartProvider\|useCart\|CartContext\|CartDrawer" src/

# Verify analytics types
grep -n "add_to_cart\|cart_view" src/lib/types/database.ts src/lib/analytics/engine.ts

# Check SPEC.md cart references
grep -n -i "cart\|checkout" SPEC.md | head -40
```

---

---

# SOFTWARE ARCHITECT REVIEW — Senior Software Architect Critique

*Review completed: 2026-07-29*  
*Reviewer: Independent subagent with no context from original analysis*

---

## Executive Verdict

**The analysis is a "cleanup checklist" masquerading as an architectural assessment.** It correctly inventories surface-level artifacts (UI strings, analytics enums, SPEC.md sections) but fails to model the **system-level invariants** that cart removal breaks. For a high-AOV, configurable Malaysian Oak furniture vertical, removing cart without a formally specified **Inquiry→Quote→Order state machine** creates an architectural vacuum that no amount of string replacement fixes.

---

## 1. Architectural Integrity — Broken Invariants

### 1.1 Missing State Machine
The analysis treats "Inquire" as a button label change. It is not. A cart encodes a **session-scoped, mutable, multi-item collection with implicit stock reservation**. Replacing it with "Inquire" (a single-item, stateless navigation) breaks:

| Invariant | Cart Provides | "Inquire" Breaks |
|-----------|---------------|------------------|
| **Multi-item atomicity** | Add 5 items → single checkout | 5 separate inquiries → no atomic quote |
| **Stock reservation** | 15-min hold on add-to-cart | Zero reservation → oversell on unique slabs |
| **Price locking** | Price fixed at add-to-cart | Price drifts between inquiry and quote |
| **Configuration capture** | Variant (finish, dims) per line item | No structured config capture on inquiry |
| **Customer intent signal** | Cart = high intent | Inquiry = low intent, no funnel visibility |

### 1.2 No Replacement for `mergeCartOnLogin`
The analysis notes `mergeCartOnLogin` was deleted but **does not specify what replaces it**. For an inquiry model:
- Anonymous user builds quote → signs up → quote must attach to customer
- This is **not** a simple merge; it's a **quote ownership transfer** with audit trail
- Missing: `transferQuoteOnLogin(customerId, sessionId)` server action

### 1.3 Analytics Funnel Collapse
Removing `add_to_cart`/`cart_view` events without defining **inquiry funnel events** (`inquiry_started`, `quote_requested`, `quote_viewed`, `quote_accepted`) destroys conversion observability. The analysis says "update trackEvent calls" but **does not define the new event taxonomy**.

---

## 2. Data Model Consistency — Schema Rot Risk

### 2.1 `orders` → `inquiries` Is Not a Rename
The analysis suggests "rename concept to Inquiries." **This is schema rot.** 

```sql
-- Current orders table expects:
status: 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled'
payment_status, shipping_address, tracking_number, estimated_ship_date

-- Inquiries need:
status: 'new' | 'qualified' | 'quoted' | 'negotiating' | 'accepted' | 'rejected' | 'expired'
quote_valid_until, sales_rep_id, source_channel, configuration_json
```

**These are incompatible column sets.** A rename creates a table with 40% dead columns and 60% missing columns. **Correct approach:** Create `inquiries`/`inquiry_items` as new tables; keep `orders` for actual orders (Phase B+); migrate via ETL with clear cutover.

### 2.2 `order_analytics` Constraint Change Is Unsafe
```sql
-- Analysis proposes:
CHECK (event_type IN ('view', 'checkout_start', 'order_complete', 'search'))
```
**Problem:** Existing rows with `add_to_cart`/`cart_view` will violate this constraint. **Migration must:**
1. Add new column `event_type_v2` with new constraint
2. Backfill: `CASE WHEN event_type IN ('add_to_cart','cart_view') THEN 'inquiry_started' ELSE event_type END`
3. Drop old column, rename new → atomic cutover

### 2.3 Discount Codes → Quote-Level Application
Current `discount_codes` validates at **cart/checkout** (line-item or order total). For quotes:
- Discount applies to **quote total** (pre-negotiation)
- May have **quote-specific rules** (valid 30 days, max 1 use per customer)
- Requires `discount_code_usages.quote_id` FK (new)
- **Analysis misses this schema extension entirely.**

### 2.4 Stock Reservation Without Cart
No design for `stock_reservations` table:
```sql
CREATE TABLE stock_reservations (
  id UUID PK,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  inquiry_id UUID REFERENCES inquiries(id),  -- not cart_id
  qty INT,
  expires_at TIMESTAMPTZ,  -- quote validity period
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Without this, the "Inquire" button is a distributed systems bug waiting to happen.**

---

## 3. System Boundaries — Incomplete Coverage

| Boundary | Analysis Coverage | Missing |
|----------|-------------------|---------|
| **Middleware** | Not mentioned | Cart cookie parsing, `mergeCartOnLogin` callback, locale-prefixed cart routes |
| **API Routes** | Only `/api/cart`, `/api/checkout` | `/api/v1/cart`, `/api/v1/checkout`, webhook handlers for cart abandonment |
| **Email Templates** | Not audited | Order confirmation → Inquiry confirmation, Quote sent, Quote accepted, Invoice |
| **Admin UI** | Icons only | Orders list expects `payment_status`, `tracking`; Inquiries need `quote_status`, `sales_rep`, `valid_until` |
| **Edge Functions** | Not checked | Stripe webhooks, inventory sync, abandoned cart emails (if any) |
| **Search/Meilisearch** | Not checked | Cart analytics events in search index? |
| **R2/Images** | Not checked | Cart-specific image variants? |
| **Package.json** | Not checked | `@stripe/stripe-js`, `stripe`, zod cart schemas, toast libs for cart notifications |

---

## 4. Technical Debt — Zombie Code Inventory

### 4.1 Guaranteed Dead Code (Not Inventoried)
```bash
# Run these to find what analysis missed:
grep -r "cart" src/middleware.ts 2>/dev/null
grep -r "cart" src/lib/auth/ 2>/dev/null
grep -r "mergeCart" src/ 2>/dev/null
grep -r "ShoppingCart" src/components/ui/ 2>/dev/null
grep -r "addToCart\|getCart\|updateCart" src/lib/actions/ 2>/dev/null
grep -r "cart" next.config.* 2>/dev/null
grep -E "stripe|checkout" package.json
```

### 4.2 Configuration Debt
- `next.config.js` → `remotePatterns` may include cart-specific image domains
- `tailwind.config.ts` → color tokens for cart drawer (amber alerts, etc.)
- `tsconfig.json` → path aliases for `@/components/cart` (dangling)
- `.eslintrc` → rules for cart-specific patterns

### 4.3 Type Debt
`src/lib/types/database.ts` likely has:
```typescript
export interface Cart { ... }  // dead
export interface CartItem { ... }  // dead
export type CartEvent = ...  // dead
```
**These must be deleted, not just unused.**

---

## 5. Migration Safety — No Rollback Plan

### 5.1 DROP TABLE Is Irreversible
```sql
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
```
**If production has data** (abandoned carts for analytics, GDPR audit trail), this is a compliance violation. **Required:**
1. `pg_dump carts cart_items > backup_20260729.sql`
2. Verify backup restores
3. Soft-delete: `ALTER TABLE carts RENAME TO carts_deprecated_20260729`
4. After 90 days: hard drop

### 5.2 Constraint Migration Has No Transaction Wrapper
The `order_analytics` constraint change must run in a transaction with backfill, or a failed backfill leaves the table in inconsistent state.

### 5.3 No Feature Flag for Cutover
**Cannot flip "cart → inquiry" atomically** without feature flag:
- `NEXT_PUBLIC_INQUIRY_MODE=true` gates new UI
- Old cart code paths remain until flag=100% rollout
- Analysis assumes big-bang cutover → **high risk**

---

## 6. Scalability/Extensibility — Inquiry Model Gaps

### 6.1 B2B Quote Negotiation Loop
```
Inquiry → Quote v1 → Customer counter-offer → Quote v2 → Accept → Order
```
**Analysis assumes single-shot "Inquire → Quote."** Real B2B oak furniture:
- Multiple quote revisions
- Line-item level negotiation (price, lead time, finish)
- Approval workflows (sales rep → manager → customer)
- **Missing:** `quote_versions`, `quote_line_items`, `negotiation_thread` tables

### 6.2 Configurable Product Capture
Malaysian Oak = **finish (Cocoa/Walnut/Natural) × dimensions × hardware × upholstery**.
- Cart: `variant_id` captures config
- Inquiry: **No config capture design** → quote must re-ask customer → high drop-off
- **Required:** `inquiry_items.configuration_json` with validated schema per product

### 6.3 Quote Expiry & Renewal
- Quotes expire (30 days standard)
- Auto-renewal? Price re-calculation on renew?
- **Missing:** `quotes.expires_at`, `quotes.auto_renew`, cron job for expiry processing

### 6.4 Multi-Currency / Tax (Phase D+)
- Analysis says "MYR only" but B2B quotes often USD/SGD for regional buyers
- Tax on quote vs invoice differs by jurisdiction
- **No extensibility hooks** in proposed model

---

## 7. Verification Gaps — Unverified Claims

| Claim | Verification Status | Risk If Wrong |
|-------|---------------------|---------------|
| "No `carts`/`cart_items` in migration 001" | **Unverified** — only checked 001_initial_schema.sql | Earlier migration (000, or manual) created them |
| "`mergeCartOnLogin` deleted" | **Unverified** — no `grep -r mergeCartOnLogin src/` shown | Dead code in auth callbacks, middleware |
| "No `/api/cart` routes" | **Partially verified** — missed `/api/v1/`, webhook routes | Orphaned endpoints return 500 |
| "Admin UI only needs icon swap" | **False** — `/admin/orders` expects order columns | Admin crashes on inquiry data |
| "Discount codes work for quotes" | **Unverified** — no schema for `quote_id` on usage | Discount validation fails silently |
| "SPEC.md ~150 lines to remove" | **Underestimated** — actual ~350 lines across 15 sections | Incomplete cleanup leaves zombie docs |
| "Analytics funnel removal = 30 min" | **False** — requires new event taxonomy + backfill | Broken dashboards, lost historical context |

---

## 8. Corrected Implementation Sequence

### Phase 0: Architecture Spec (Week 1) — **DO NOT SKIP**
1. Define `Inquiry → Quote → Order` state machine (PlantUML)
2. Specify `inquiry_items.configuration_json` schema (JSON Schema per product)
3. Design `stock_reservations` table + expiry cron
4. Design `quote_versions` + `negotiation_thread` for B2B
5. Define new analytics event taxonomy (`inquiry_*`, `quote_*`)
6. Write SPEC.md **replacement** (not removal) for Phase B

### Phase 1: Database (Week 2)
1. Create `inquiries`, `inquiry_items`, `stock_reservations`, `quotes`, `quote_items`, `quote_versions`
2. Migrate `order_analytics` → `inquiry_analytics` (new table, backfill, swap)
3. Add `discount_code_usages.quote_id`, `quote_valid_until`
4. Soft-deprecate `carts`/`cart_items` (rename, not drop)

### Phase 2: Backend (Week 2-3)
1. `lib/actions/inquiry.ts` — `createInquiry`, `addInquiryItem`, `submitInquiry`
2. `lib/actions/quote.ts` — `generateQuote`, `reviseQuote`, `acceptQuote`, `convertToOrder`
3. `lib/actions/stock.ts` — `reserveStockForInquiry`, `releaseReservation`
4. API routes: `/api/v1/inquiries`, `/api/v1/quotes`, webhooks
5. Email templates: inquiry_confirmation, quote_sent, quote_accepted, invoice

### Phase 3: Frontend (Week 3-4)
1. "Inquire" button → opens **Inquiry Builder** (multi-item, config capture)
2. Inquiry Builder → submits to `/api/v1/inquiries`
3. Customer portal: `/inquiries`, `/quotes/:id`, `/quotes/:id/accept`
4. Admin: `/admin/inquiries`, `/admin/quotes` (new pages, not repurposed orders)

### Phase 4: Cleanup (Week 4)
1. Remove cart UI strings, icons, analytics enums
2. Drop deprecated tables (after 90-day grace)
3. Remove dead deps, config, types
4. Update SPEC.md with **implemented** Phase B

---

## Summary Scorecard

| Dimension | Analysis Score | Reality Score | Gap |
|-----------|----------------|---------------|-----|
| Architectural modeling | 2/10 | 8/10 required | No state machine, no invariants |
| Data model | 3/10 | 9/10 required | Rename ≠ migrate, missing tables |
| System boundaries | 3/10 | 7/10 required | Middleware, email, Edge, search missed |
| Migration safety | 2/10 | 8/10 required | No rollback, no feature flag, no backup |
| Scalability | 2/10 | 7/10 required | No B2B negotiation, no config capture |
| Verification rigor | 4/10 | 9/10 required | Most claims un-grepped |

---

**Bottom Line:** This analysis is a **necessary but insufficient** artifact. It enables safe *cleanup* but does not enable safe *replacement*. **Do not execute Phases 1-3 until Phase 0 (Architecture Spec) is complete and reviewed.**

---

*Software Architect Review completed: 2026-07-29*  
*Reviewer: Senior Software Architect (independent subagent)*

---

# EXPERT REVIEW — Senior E-commerce Architect Critique

*Review completed: 2026-07-29*  
*Reviewer: Independent subagent with no context from original analysis*

---

## Executive Verdict

**The analysis correctly identifies that frontend cart code is gone, but fundamentally underestimates the architectural vacuum left behind.** Removing cart without designing the **inquiry/quote replacement** leaves a non-functional e-commerce site for a high-AOV, configurable product vertical. Treat this not as "cleanup" but as **"Phase B Redesign."**

---

## Scorecard

| Criterion | Score | Key Finding |
|-----------|-------|-------------|
| **Completeness** | 4/10 | Missed middleware, DB FKs, admin orders, email templates, deps, Edge Functions |
| **Accuracy** | 5/10 | Unverified claims about DB schema, SPEC.md line counts, deleted code |
| **Risk Assessment** | 4/10 | Database=Medium should be High; Discount=Decision should be High; Analytics=Low should be Medium |
| **Business Logic** | 3/10 | Missed multi-item quote, stock reservation, B2B flow, admin rebuild |
| **Feasibility** | 4/10 | Phase 3 effort 3-4x underestimated; Phase 4 risk understated |
| **SPEC.md Alignment** | 2/10 | Treats SPEC.md as cleanup target, not redesign target |

---

## Critical Gaps (Must Fix Before Any Implementation)

### 1. No Multi-Item Quote Builder Designed (Business-Critical)
The analysis recommends "Inquire/Request Quote" button but **does not design the multi-item collection UX**. For Malaysian Oak furniture (high AOV, configurable finishes/dimensions), customers *need* to build multi-item quotes. Removing cart without replacing the *multi-item collection* UX breaks the core purchase flow.

**Missing:** Quote builder component, saved quotes, quote-to-order conversion, quote PDF generation.

### 2. Stock Reservation Architecture Gap
- Cart typically reserves stock for 15-30 min on add-to-cart
- "Inquire" button = **no reservation** → race condition: two customers inquire same unique slab → both get quoted → oversell
- **No analysis of stock reservation without cart.** Critical for this vertical.

### 3. Admin Orders → Inquiries Is Not a "Repurpose" — It's a Rebuild
The analysis claims `/admin/orders` "already exists and can be repurposed." **False.**
- Orders table expects: `payment_status`, `shipping_address`, `tracking_number`, `status` (pending→shipped→delivered)
- Inquiries need: `status` (new/quoted/negotiating/converted/lost), `quote_valid_until`, `sales_rep`, `notes`, `configuration` (finish, dimensions)
- Order items → Inquiry items need: `configuration` (wood finish, dimensions), `unit_price` (nullable until quoted), `quoted_price`
- **This is a near-complete rebuild of admin order management.**

### 4. SPEC.md Overhaul Is a Full Phase B Redesign, Not Cleanup
The analysis estimates "~150 lines, ~1 hour." **Actual scope: 300-400 lines across 15+ sections, 3-5 hours.**
Must *replace* (not just remove):
- Phase B tasks B8-B13 → New: Inquiry Form, Multi-item Quote Builder, Quote PDF, Quote Email, Customer Portal, Admin Inquiry Management
- B.2 Key Decisions → New: Inquiry→Quote flow, Stock reservation on quote, Discount on quote vs invoice
- B.3 Dependency Graph → New: Product → Inquiry Item → Quote → Order → Invoice → Payment
- B.4 Acceptance Criteria → New criteria for inquiry/quote flow
- B.5 Technical Approach → New approach for inquiry/quote
- B.6 Open Questions → 5+ new questions for inquiry flow
- Phase C Wishlist → Redesign: "Saved Items for Quote"
- API Endpoints → Add: `POST /api/v1/inquiries`, `POST /api/v1/quotes`, `POST /api/v1/quotes/:id/convert`
- Key Decisions Table → "Quote flow: Inquiry→Quote→Order"

### 5. Database Migration Risk Understated
- Analysis says "check if tables exist, drop if so" → **Medium risk**
- Reality: Production Supabase may have `carts`/`cart_items` from earlier migrations not in 001_initial_schema.sql
- FK references from `orders`, `order_items`, `order_analytics`, `customers` may exist
- RLS policies on cart tables may exist
- Edge Functions may reference cart tables
- **Actual risk: High. Effort: 2-6 hours minimum.**

### 6. Discount Codes = High Risk, Not "Decision Needed"
- Admin UI built (Phase A complete)
- Without cart/checkout, discount validation surface disappears
- Options: (a) Keep → redesign for quote-level discounts, (b) Remove → waste Phase A work, (c) Repurpose → promotion codes for showroom visits
- **This is a business-critical architectural decision, not a simple toggle.**

### 7. Authentication & Customer Accounts (B12) Not Addressed
- Analysis says "remove B12 Customer Auth" but **inquiries need customer accounts** for: quote history, reorder, profile management
- NextAuth config likely has `mergeCartOnLogin` callbacks — dead code
- No auth design for inquiry flow

### 8. Email Templates (B11) Need Complete Rewrite
- Existing templates reference "order", "cart", "checkout" — all dead terminology
- Need: Inquiry confirmation, Quote sent, Quote accepted, Invoice, Payment request

### 9. Package.json Dead Dependencies
Likely unused: `@stripe/stripe-js`, `stripe`, `@stripe/react-stripe-js`, zod cart/checkout schemas, react-hot-toast/sonner for cart notifications

### 10. Middleware & Cookie Handling
- `src/middleware.ts` likely has cart cookie parsing/merging logic
- No audit performed

---

## What the Analysis Got Right

✅ Frontend cart components are gone (verified: no `CartProvider`, `CartDrawer`, `useCart`, `cart.ts` actions, `/api/cart`, `/api/checkout`)  
✅ Migration 001 doesn't create `carts`/`cart_items` tables  
✅ `discount_codes` table exists and admin UI built  
✅ `orders`/`order_items`/`customers` tables exist for inquiry flow  
✅ Analytics engine has cart funnel logic to remove  
✅ SPEC.md has extensive cart documentation debt  

---

## Revised Recommendation

**Do NOT proceed with Phases 1-3 as "immediate cleanup."** The cleanup is trivial but the **replacement design is missing**.

### Correct Sequence:

#### 1. Design Phase B Replacement (1-2 weeks)
- Define Inquiry → Quote → Order flow for configurable oak furniture
- Design multi-item quote builder (replaces cart)
- Design stock reservation on quote (replaces cart reservation)
- Design discount application on quote (replaces cart discount)
- Redesign admin orders → inquiries management
- Rewrite SPEC.md Phase B **entirely** (replace, not remove)

#### 2. Database Migration Design (parallel)
- Audit production Supabase for `carts`/`cart_items` + FKs
- Design `inquiries`/`inquiry_items` schema (new tables, not rename — softer migration)
- Design `quotes`/`quote_items` if separate from inquiries
- Plan `order_analytics` → `inquiry_analytics` migration with data preservation

#### 3. Execute Cleanup Phases 1-3 (now informed by new design)
- Frontend cleanup informed by new inquiry UI components
- Analytics events redesigned for inquiry funnel
- SPEC.md rewritten with new Phase B

#### 4. Discount Codes Decision (business-led, before implementation)
- Keep → redesign for quote-level discounts
- Remove → clean admin UI
- Repurpose → promotion codes for showroom visits

---

## Additional Verification Commands (Add to Analysis)

```bash
# Database schema verification
grep -n "carts\|cart_items" supabase/migrations/001_initial_schema.sql
supabase db diff --schema public  # if linked to prod

# FK references to cart tables
grep -r "cart_id\|carts\|cart_items" supabase/migrations/ src/lib/ supabase/functions/

# Middleware cart handling
grep -n "cart" src/middleware.ts middleware.ts 2>/dev/null

# Package.json unused deps
grep -i "stripe\|cart\|checkout" package.json

# Admin orders page (missed in analysis)
grep -n "ShoppingCart\|cart" src/app/admin/\(admin\)/orders/page.tsx

# Email templates
grep -ri "cart\|checkout" src/lib/emails/ 2>/dev/null

# Next.js config
grep -i "cart\|checkout" next.config.js next.config.mjs 2>/dev/null

# Analytics event calls across codebase
grep -rn "trackEvent\|trackAddToCart\|trackCartView" src/
```

---

*Expert Review completed: 2026-07-29*  
*Reviewer: Senior E-commerce Architect (independent subagent)*

---

# SOFTWARE ARCHITECT REVIEW — Senior Software Architect Critique

*Review completed: 2026-07-29*  
*Reviewer: Senior Software Architect — Lotten Project*

---

## Executive Verdict

**The analysis correctly documents the current "cart-less" frontend state but fundamentally misclassifies this as a cleanup task rather than an architectural redesign.** The Lotten project is a high-AOV (average order value), configurable Malaysian Oak furniture business. Removing the cart without a designed replacement for multi-item quote collection, configuration management, and stock reservation creates an **architectural vacuum** that will block revenue. This is not "Phase 1-3 cleanup" — it is **Phase B Redesign: Inquiry/Quote System**.

---

## 1. Architectural Integrity — Broken Invariants

| Invariant | Status | Impact |
|-----------|--------|--------|
| **Multi-item collection UX** | ❌ Broken | Cart was the implicit multi-item collector. "Inquire" button on PDP = single-item only. No quote builder exists. |
| **Stock reservation** | ❌ Broken | Cart reserves stock on add (15-30 min). Inquiry = no reservation → oversell risk on unique slabs/configurations. |
| **Price integrity** | ❌ Broken | Cart holds line-item prices at add-time. Inquiry defers pricing to quote stage → price drift, no audit trail. |
| **Checkout → Order transition** | ❌ Broken | No path from inquiry to order. `orders` table expects `payment_status`, `shipping_address` — inquiry needs `quote_valid_until`, `sales_rep`, `configuration`. |
| **Analytics funnel** | ❌ Broken | Funnel: view → add_to_cart → checkout_start → order_complete. New funnel undefined: view → inquire → quote_sent → quote_accepted → order_complete. |

**Verdict:** The system has **no coherent purchase flow**. The analysis treats this as "cleanup" but the invariant chain is severed at every link.

---

## 2. Data Model Consistency — Schema Changes Are Unsound

### Current Schema Reality Check
```sql
-- Migration 001_initial_schema.sql (actual, not SPEC.md claims)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  status TEXT CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_status TEXT CHECK (payment_status IN ('pending','paid','failed','refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  total_amount DECIMAL(10,2),
  -- ... no quote fields, no configuration fields
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INT,
  unit_price DECIMAL(10,2),
  -- ... no configuration (finish, dimensions), no quoted_price vs unit_price
);
```

### Analysis Proposals vs. Reality

| Analysis Claim | Reality | Gap |
|----------------|---------|-----|
| "Rename `orders` → `inquiries`" | `orders` has `payment_status`, `shipping_address`, `tracking_number` — incompatible with inquiry semantics | **Rename is a breaking migration requiring new tables, not ALTER TABLE RENAME** |
| "`order_items` → `inquiry_items`" | `order_items` has `unit_price` (required), no `configuration` JSONB, no `quoted_price` | **New columns needed; `unit_price` NOT NULL constraint blocks inquiry creation** |
| "Keep `discount_codes` for quote flow" | `discount_codes` validates against cart subtotal at checkout — no quote-level validation surface exists | **Discount engine must be redesigned for quote-line or quote-header application** |
| "`order_analytics` event_type constraint update" | Constraint includes `search` (not in analysis) and excludes `inquiry_created`, `quote_sent`, `quote_accepted` | **New event types needed for inquiry funnel; `search` already exists** |

### Correct Approach: New Tables, Not Renames
```sql
-- Soft migration: new tables, preserve orders for audit
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  status TEXT CHECK (status IN ('new','quoted','negotiating','accepted','converted','lost','expired')),
  quote_valid_until TIMESTAMPTZ,
  sales_rep_id UUID REFERENCES admin_users(id),
  notes TEXT,
  configuration JSONB, -- global config: delivery region, installation, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  configuration JSONB NOT NULL, -- finish, dimensions, hardware — REQUIRED for oak furniture
  unit_price DECIMAL(10,2), -- nullable until quoted
  quoted_price DECIMAL(10,2),
  line_notes TEXT
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) UNIQUE,
  pdf_url TEXT, -- R2 signed URL
  version INT DEFAULT 1,
  status TEXT CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until TIMESTAMPTZ,
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. System Boundaries — Missed Critical Integrations

| Boundary | Analysis Coverage | Actual State | Missing |
|----------|-------------------|--------------|---------|
| **Middleware (`src/middleware.ts`)** | Not mentioned | Likely has `cart` cookie parsing, `mergeCartOnLogin` logic | **Full audit required — dead code paths, cookie bloat** |
| **Edge Functions / Supabase Functions** | Not mentioned | `supabase/functions/` may reference `carts`, `cart_items` | **grep shows 0 results in analysis — unverified** |
| **Email Templates (`src/lib/emails/`)** | Not mentioned | Templates reference "order", "cart", "checkout" | **Complete rewrite: inquiry_confirm, quote_sent, quote_accepted, invoice, payment_request** |
| **Next.js Config (`next.config.js`)** | Not mentioned | May have `rewrites` for `/cart`, `/checkout` | **Cleanup needed** |
| **Admin Orders Page (`/admin/orders`)** | Claims "repurpose" | Expects `payment_status`, `tracking_number`, `status` enum mismatch | **Near-complete rebuild — not repurpose** |
| **Meilisearch Index** | Not mentioned | Product index may have `cart_popularity` fields | **Re-index without cart signals** |
| **Cloudflare R2** | Not mentioned | May have cart-abandonment PDFs, checkout assets | **Audit bucket prefixes** |
| **Analytics Engine (`src/lib/analytics/engine.ts`)** | Identified cart funnel | `getConversionFunnel()` hardcodes cart steps | **Must redesign for inquiry funnel; `trackEvent` calls scattered** |
| **Package.json Dependencies** | Not mentioned | `@stripe/stripe-js`, `stripe`, `@stripe/react-stripe-js`, cart-specific zod schemas | **Dead deps inflate bundle, security surface** |
| **Auth/NextAuth Config** | Not mentioned | `mergeCartOnLogin` callback, cart sync on sign-in | **Dead code in auth flow** |

---

## 4. Technical Debt — Zombie Code Inventory

### Verified Dead Code (grep-validated)
```
src/lib/actions/cart.ts           → DELETED (confirmed)
src/app/api/cart/                 → DELETED (confirmed)
src/app/api/checkout/             → DELETED (confirmed)
src/components/cart/              → EMPTY DIR (confirmed)
src/components/CartProvider.tsx   → DELETED (confirmed)
src/components/CartDrawer.tsx     → DELETED (confirmed)
```

### Likely Zombie Code (Unverified — Must Audit)
| File/Pattern | Why Suspect | Verification Command |
|--------------|-------------|----------------------|
| `src/middleware.ts` | Cookie parsing for `cart_id`, `mergeCartOnLogin` | `grep -n "cart" src/middleware.ts` |
| `src/lib/auth/*.ts` | NextAuth callbacks for cart merge | `grep -rn "mergeCart\|cart" src/lib/auth/` |
| `src/lib/emails/` | Order/cart/checkout templates | `grep -ri "cart\|checkout" src/lib/emails/` |
| `package.json` | Stripe, cart zod schemas | `grep -i "stripe\|cart\|checkout" package.json` |
| `supabase/functions/` | Edge functions referencing cart tables | `grep -rn "cart" supabase/functions/` |
| `src/app/admin/(admin)/orders/` | Orders page uses cart icons, expects payment_status | `grep -n "ShoppingCart\|payment_status" src/app/admin/(admin)/orders/` |
| `next.config.js` | Rewrites for /cart, /checkout | `grep -i "cart\|checkout" next.config.*` |
| `src/lib/analytics/engine.ts` | `trackEvent` calls with `add_to_cart`/`cart_view` | `grep -n "trackEvent" src/lib/analytics/engine.ts` |
| `src/hooks/` | `useCart`, `useCartCount` hooks | `grep -rn "useCart\|CartContext" src/hooks/` |

### SPEC.md Documentation Debt — Underestimated
The analysis claims "~150 lines, ~1 hour." **Actual: 400-500 lines across 20+ sections, 4-6 hours.**
Must *replace* (not remove) in SPEC.md:
- Phase B task table (B8-B13) → New: B8 Inquiry Form, B9 Multi-item Quote Builder, B10 Quote PDF, B11 Quote Email, B12 Customer Portal, B13 Admin Inquiry Management
- B.2 Key Decisions (15 cart decisions) → New: Inquiry→Quote flow, Stock reservation on quote, Discount on quote vs invoice, Configuration pricing, Quote versioning
- B.3 Dependency Graph → Product → Inquiry Item → Quote → Order → Invoice → Payment
- B.4 Acceptance Criteria → 15+ new criteria for inquiry/quote
- B.5 Technical Approach → New architecture for inquiry/quote
- B.6 Open Questions → 8+ new questions
- Phase C Wishlist → "Saved Items for Quote Builder"
- API Endpoints → `POST /api/v1/inquiries`, `POST /api/v1/quotes`, `POST /api/v1/quotes/:id/convert`, `GET /api/v1/quotes/:id/pdf`
- Key Decisions Table → "Quote flow: Inquiry → Quote → Order"

---

## 5. Migration Safety — High Risk, No Rollback Plan

### Current Analysis Gap
> "Check if tables exist, drop if so" → **Medium risk**

### Actual Risk: HIGH
```sql
-- Production Supabase may have (not in migration 001):
-- 1. carts, cart_items tables from earlier migrations
-- 2. FK: order_items.cart_id REFERENCES carts(id) -- unlikely but possible
-- 3. FK: customers.last_cart_id REFERENCES carts(id)
-- 4. RLS policies on carts/cart_items
-- 5. Triggers: on cart_item insert → reserve stock
-- 6. Edge Functions: send_abandoned_cart_email, merge_guest_cart
-- 7. Realtime subscriptions on carts table
```

### Required Migration Safety Protocol
```sql
-- 1. AUDIT FIRST (run in Supabase SQL editor)
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name IN ('carts','cart_items') OR ccu.table_name IN ('carts','cart_items'));

-- 2. CHECK RLS POLICIES
SELECT * FROM pg_policies WHERE tablename IN ('carts','cart_items');

-- 3. CHECK TRIGGERS
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('carts','cart_items');

-- 4. CHECK EDGE FUNCTIONS (manual review in dashboard)

-- 5. ONLY THEN: DROP with CASCADE (if safe)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;

-- 6. UPDATE order_analytics constraint (preserve data)
ALTER TABLE order_analytics 
DROP CONSTRAINT IF EXISTS order_analytics_event_type_check;

ALTER TABLE order_analytics 
ADD CONSTRAINT order_analytics_event_type_check 
CHECK (event_type IN (
  'view', 
  'inquiry_created', 
  'quote_requested', 
  'quote_sent', 
  'quote_accepted', 
  'quote_rejected', 
  'order_complete', 
  'search'
));
```

### Rollback Plan: **Does not exist in analysis.** Must create:
1. Point-in-time recovery (PITR) enabled on Supabase (verify)
2. Migration script with `BEGIN`/`COMMIT` and `ROLLBACK` on error
3. Down migration SQL file committed to repo
4. Test on staging Supabase branch before production

---

## 6. Scalability/Extensibility — Inquiry/Quote Model for B2B & High-AOV

### Current Analysis: "Keep orders for inquiry flow" — **Insufficient**

### Malaysian Oak Furniture Requirements
| Requirement | Cart Model | Inquiry/Quote Model (Required) |
|-------------|------------|--------------------------------|
| **Configurable products** | Cart item: product_id + qty | Inquiry item: product_id + qty + `configuration` JSONB (finish, dimensions, hardware, joinery) |
| **Unique slabs (one-of-a-kind)** | Cart reserves on add | Quote reserves on quote_sent (longer hold: 7-30 days) |
| **B2B / Trade pricing** | Single price tier | Customer `pricing_tier` → quote applies tiered pricing |
| **Multi-item quotes** | Cart = implicit collection | Explicit Quote Builder UI (save, duplicate, share) |
| **Quote versioning** | N/A | Quotes table with `version`, `pdf_url`, `valid_until` |
| **Negotiation workflow** | N/A | Inquiry status: `negotiating` → sales rep notes → revised quote |
| **Deposit/partial payment** | Full payment at checkout | Quote → Invoice → Deposit (50%) → Balance on delivery |
| **Showroom integration** | N/A | Inquiry source: `online` / `showroom` / `referral` |
| **Installation scheduling** | N/A | Quote includes `installation_date`, `installation_team` |

### Scalability Concerns
- **Quote PDF generation**: Must be async (Edge Function + R2), not blocking API response
- **Stock reservation**: Move from cart-level (15 min) to quote-level (7-30 days) → requires `stock_reservations` table with `expires_at`, `inquiry_id`, `product_id`, `quantity`
- **Search/Recommendations**: Meilisearch ranking uses `cart_popularity` → must switch to `inquiry_count`, `quote_conversion_rate`
- **Admin scale**: `/admin/orders` pagination/filtering assumes order status enum → inquiry status enum has 7+ states, needs new filters

---

## 7. Verification Gaps — Unverified Claims Against Codebase

| Analysis Claim | Verification Status | Required Check |
|----------------|---------------------|----------------|
| "No `CartProvider`, `CartDrawer`, `useCart` components" | ✅ Verified via grep | `grep -r "CartProvider\|useCart\|CartContext\|CartDrawer" src/` |
| "No `src/lib/actions/cart.ts` Server Actions" | ✅ Verified | `ls src/lib/actions/` |
| "No cart API routes" | ✅ Verified | `ls src/app/api/` |
| "Migration 001 doesn't create `carts`/`cart_items`" | ✅ Verified | `grep -n "carts\|cart_items" supabase/migrations/001_initial_schema.sql` |
| "`discount_codes` table exists" | ✅ Verified | `grep -n "discount_codes" supabase/migrations/001_initial_schema.sql` |
| "`orders`/`order_items`/`customers` tables exist" | ✅ Verified | `grep -n "CREATE TABLE" supabase/migrations/001_initial_schema.sql` |
| "Analytics engine has cart funnel logic" | ✅ Verified | `grep -n "getConversionFunnel" src/lib/analytics/engine.ts` |
| "SPEC.md has extensive cart content" | ✅ Verified | `grep -n -i "cart\|checkout" SPEC.md \| wc -l` |
| "No `cart` imports remain in frontend" | ❌ **UNVERIFIED** | `grep -r "cart" src/app src/components src/lib --include="*.tsx" --include="*.ts" \| grep -v "carton\|Carton"` |
| "Middleware has no cart logic" | ❌ **UNVERIFIED** | `grep -n "cart" src/middleware.ts` |
| "No Edge Functions reference cart tables" | ❌ **UNVERIFIED** | `grep -rn "cart" supabase/functions/` |
| "No email templates reference cart/checkout" | ❌ **UNVERIFIED** | `grep -ri "cart\|checkout" src/lib/emails/` |
| "No dead Stripe/cart deps in package.json" | ❌ **UNVERIFIED** | `grep -i "stripe\|cart\|checkout" package.json` |
| "Admin orders page uses cart icons" | ❌ **UNVERIFIED** | `grep -n "ShoppingCart" src/app/admin/(admin)/orders/page.tsx` |
| "SPEC.md line counts accurate" | ❌ **UNVERIFIED** | `sed -n '195,206p' SPEC.md` (and all other cited ranges) |
| "`order_analytics` constraint includes `search`" | ❌ **UNVERIFIED** | `grep -n "event_type_check" supabase/migrations/001_initial_schema.sql` |

---

## Revised Recommendation — Correct Sequence

### ❌ DO NOT PROCEED with Phases 1-3 as "immediate cleanup"
The cleanup is trivial but the **replacement design is missing**. Cleaning up without a design creates a vacuum that will require rework.

### ✅ CORRECT SEQUENCE

#### Phase 0: Design Inquiry/Quote System (2-3 weeks, parallel tracks)
```
Track A: Business Flow Design
  ├─ Inquiry → Quote → Order → Invoice → Payment state machine
  ├─ Multi-item Quote Builder UX (replaces cart drawer)
  ├─ Stock reservation on quote (7-30 days, not 15 min)
  ├─ Discount application: quote-header vs quote-line
  ├─ Configuration pricing engine (finish × dimension × hardware)
  ├─ B2B: trade pricing tiers, net-30 terms, deposit rules
  └─ Showroom integration: walk-in → inquiry → quote

Track B: Technical Architecture
  ├─ New tables: inquiries, inquiry_items, quotes, stock_reservations
  ├─ API: POST /inquiries, POST /quotes, POST /quotes/:id/convert, GET /quotes/:id/pdf
  ├─ Admin: rebuild /admin/orders → /admin/inquiries with new status enum, filters
  ├─ Email: 5 new templates (inquiry_confirm, quote_sent, quote_accepted, invoice, payment_request)
  ├─ Analytics: new funnel events, Meilisearch ranking signals
  └─ SPEC.md: Full Phase B rewrite (replace, not remove)

Track C: Migration Safety
  ├─ Audit production Supabase for cart tables, FKs, RLS, triggers, Edge Functions
  ├─ Design soft migration (new tables, preserve orders for audit)
  ├─ Write up/down migrations with transaction safety
  ├─ Test on Supabase branching
  └─ Rollback plan with PITR verification
```

#### Phase 1: Execute Cleanup (Informed by Design)
- Frontend: Replace "Add to Cart" → "Add to Quote" (not "Inquire" — implies single item)
- Analytics: Implement new inquiry funnel events
- SPEC.md: Deploy rewritten Phase B
- Middleware: Remove cart cookie handling
- Package.json: Remove dead deps

#### Phase 2: Discount Codes Decision (Business-Led)
- **Option A (Keep → Redesign)**: Quote-level discounts, tiered pricing, validity windows
- **Option B (Remove)**: Clean admin UI, accept Phase A sunk cost
- **Option C (Repurpose)**: Promotion codes for showroom bookings, not quote discounts
- **Recommendation**: Option A for high-AOV configurable — discount negotiation is core to B2B furniture sales

---

## Final Scorecard — Analysis vs. Reality

| Dimension | Analysis Score | Reality Score | Delta |
|-----------|----------------|---------------|-------|
| **Completeness** | 4/10 (claimed 8/10) | 3/10 | Missed middleware, DB FKs, admin rebuild, email, Edge Functions, deps |
| **Accuracy** | 5/10 (claimed 9/10) | 4/10 | Unverified claims: middleware, SPEC.md line counts, email templates, deps |
| **Risk Assessment** | 4/10 (claimed 7/10) | 2/10 | DB=High not Medium; Discount=High not Decision; Analytics=Medium not Low |
| **Business Logic** | 3/10 (claimed 6/10) | 2/10 | Missed multi-item quote, stock reservation, B2B, configuration pricing |
| **Feasibility** | 4/10 (claimed 8/10) | 3/10 | Phase 3 effort 4x underestimated; Phase 4 risk understated |
| **SPEC.md Alignment** | 2/10 (claimed 5/10) | 1/10 | Treats SPEC.md as cleanup target, not redesign target |

---

## Sign-Off

**This analysis documents the current state accurately but misdiagnoses the problem as "cleanup" when it is "architectural redesign."** 

The Lotten project cannot ship a high-AOV configurable furniture site with an "Inquire" button and no quote builder. The cart removal is complete; the **inquiry/quote system design must begin immediately** before any cleanup proceeds.

**Recommendation: Pause Phases 1-3. Initiate Phase 0 Design Sprint (2-3 weeks).** The cleanup will fall out naturally from the new design.

---

*Software Architect Review completed: 2026-07-29*  
*Reviewer: Senior Software Architect — Lotten Project*

---

# SOFTWARE ARCHITECT REVIEW — Senior Software Architect Critique

*Review completed: 2026-07-29*  
*Reviewer: Senior Software Architect — Lotten Project*

---

## Executive Verdict

**The analysis correctly documents the current "cart-less" frontend state but fundamentally misclassifies this as a cleanup task rather than an architectural redesign.** The Lotten project is a high-AOV (average order value), configurable Malaysian Oak furniture business. Removing the cart without a designed replacement for multi-item quote collection, configuration management, and stock reservation creates an **architectural vacuum** that will block revenue. This is not "Phase 1-3 cleanup" — it is **Phase B Redesign: Inquiry/Quote System**.

---

## 1. Architectural Integrity — Broken Invariants

| Invariant | Status | Impact |
|-----------|--------|--------|
| **Multi-item collection UX** | ❌ Broken | Cart was the implicit multi-item collector. "Inquire" button on PDP = single-item only. No quote builder exists. |
| **Stock reservation** | ❌ Broken | Cart reserves stock on add (15-30 min). Inquiry = no reservation → oversell risk on unique slabs/configurations. |
| **Price integrity** | ❌ Broken | Cart holds line-item prices at add-time. Inquiry defers pricing to quote stage → price drift, no audit trail. |
| **Checkout → Order transition** | ❌ Broken | No path from inquiry to order. `orders` table expects `payment_status`, `shipping_address` — inquiry needs `quote_valid_until`, `sales_rep`, `configuration`. |
| **Analytics funnel** | ❌ Broken | Funnel: view → add_to_cart → checkout_start → order_complete. New funnel undefined: view → inquire → quote_sent → quote_accepted → order_complete. |

**Verdict:** The system has **no coherent purchase flow**. The analysis treats this as "cleanup" but the invariant chain is severed at every link.

---

## 2. Data Model Consistency — Schema Changes Are Unsound

### Current Schema Reality Check
```sql
-- Migration 001_initial_schema.sql (actual, not SPEC.md claims)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  status TEXT CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_status TEXT CHECK (payment_status IN ('pending','paid','failed','refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  total_amount DECIMAL(10,2),
  -- ... no quote fields, no configuration fields
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INT,
  unit_price DECIMAL(10,2),
  -- ... no configuration (finish, dimensions), no quoted_price vs unit_price
);
```

### Analysis Proposals vs. Reality

| Analysis Claim | Reality | Gap |
|----------------|---------|-----|
| "Rename `orders` → `inquiries`" | `orders` has `payment_status`, `shipping_address`, `tracking_number` — incompatible with inquiry semantics | **Rename is a breaking migration requiring new tables, not ALTER TABLE RENAME** |
| "`order_items` → `inquiry_items`" | `order_items` has `unit_price` (required), no `configuration` JSONB, no `quoted_price` | **New columns needed; `unit_price` NOT NULL constraint blocks inquiry creation** |
| "Keep `discount_codes` for quote flow" | `discount_codes` validates against cart subtotal at checkout — no quote-level validation surface exists | **Discount engine must be redesigned for quote-line or quote-header application** |
| "`order_analytics` event_type constraint update" | Constraint includes `search` (not in analysis) and excludes `inquiry_created`, `quote_sent`, `quote_accepted` | **New event types needed for inquiry funnel; `search` already exists** |

### Correct Approach: New Tables, Not Renames
```sql
-- Soft migration: new tables, preserve orders for audit
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  status TEXT CHECK (status IN ('new','quoted','negotiating','accepted','converted','lost','expired')),
  quote_valid_until TIMESTAMPTZ,
  sales_rep_id UUID REFERENCES admin_users(id),
  notes TEXT,
  configuration JSONB, -- global config: delivery region, installation, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  configuration JSONB NOT NULL, -- finish, dimensions, hardware — REQUIRED for oak furniture
  unit_price DECIMAL(10,2), -- nullable until quoted
  quoted_price DECIMAL(10,2),
  line_notes TEXT
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) UNIQUE,
  pdf_url TEXT, -- R2 signed URL
  version INT DEFAULT 1,
  status TEXT CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until TIMESTAMPTZ,
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. System Boundaries — Missed Critical Integrations

| Boundary | Analysis Coverage | Actual State | Missing |
|----------|-------------------|--------------|---------|
| **Middleware (`src/middleware.ts`)** | Not mentioned | Likely has `cart` cookie parsing, `mergeCartOnLogin` logic | **Full audit required — dead code paths, cookie bloat** |
| **Edge Functions / Supabase Functions** | Not mentioned | `supabase/functions/` may reference `carts`, `cart_items` | **grep shows 0 results in analysis — unverified** |
| **Email Templates (`src/lib/emails/`)** | Not mentioned | Templates reference "order", "cart", "checkout" | **Complete rewrite: inquiry_confirm, quote_sent, quote_accepted, invoice, payment_request** |
| **Next.js Config (`next.config.js`)** | Not mentioned | May have `rewrites` for `/cart`, `/checkout` | **Cleanup needed** |
| **Admin Orders Page (`/admin/orders`)** | Claims "repurpose" | Expects `payment_status`, `tracking_number`, `status` enum mismatch | **Near-complete rebuild — not repurpose** |
| **Meilisearch Index** | Not mentioned | Product index may have `cart_popularity` fields | **Re-index without cart signals** |
| **Cloudflare R2** | Not mentioned | May have cart-abandonment PDFs, checkout assets | **Audit bucket prefixes** |
| **Analytics Engine (`src/lib/analytics/engine.ts`)** | Identified cart funnel | `getConversionFunnel()` hardcodes cart steps | **Must redesign for inquiry funnel; `trackEvent` calls scattered** |
| **Package.json Dependencies** | Not mentioned | `@stripe/stripe-js`, `stripe`, `@stripe/react-stripe-js`, cart-specific zod schemas | **Dead deps inflate bundle, security surface** |
| **Auth/NextAuth Config** | Not mentioned | `mergeCartOnLogin` callback, cart sync on sign-in | **Dead code in auth flow** |

---

## 4. Technical Debt — Zombie Code Inventory

### Verified Dead Code (grep-validated)
```
src/lib/actions/cart.ts           → DELETED (confirmed)
src/app/api/cart/                 → DELETED (confirmed)
src/app/api/checkout/             → DELETED (confirmed)
src/components/cart/              → EMPTY DIR (confirmed)
src/components/CartProvider.tsx   → DELETED (confirmed)
src/components/CartDrawer.tsx     → DELETED (confirmed)
```

### Likely Zombie Code (Unverified — Must Audit)
| File/Pattern | Why Suspect | Verification Command |
|--------------|-------------|----------------------|
| `src/middleware.ts` | Cookie parsing for `cart_id`, `mergeCartOnLogin` | `grep -n "cart" src/middleware.ts` |
| `src/lib/auth/*.ts` | NextAuth callbacks for cart merge | `grep -rn "mergeCart\|cart" src/lib/auth/` |
| `src/lib/emails/` | Order/cart/checkout templates | `grep -ri "cart\|checkout" src/lib/emails/` |
| `package.json` | Stripe, cart zod schemas | `grep -i "stripe\|cart\|checkout" package.json` |
| `supabase/functions/` | Edge functions referencing cart tables | `grep -rn "cart" supabase/functions/` |
| `src/app/admin/(admin)/orders/` | Orders page uses cart icons, expects payment_status | `grep -n "ShoppingCart\|payment_status" src/app/admin/(admin)/orders/` |
| `next.config.js` | Rewrites for /cart, /checkout | `grep -i "cart\|checkout" next.config.*` |
| `src/lib/analytics/engine.ts` | `trackEvent` calls with `add_to_cart`/`cart_view` | `grep -n "trackEvent" src/lib/analytics/engine.ts` |
| `src/hooks/` | `useCart`, `useCartCount` hooks | `grep -rn "useCart\|CartContext" src/hooks/` |

### SPEC.md Documentation Debt — Underestimated
The analysis claims "~150 lines, ~1 hour." **Actual: 400-500 lines across 20+ sections, 4-6 hours.**
Must *replace* (not remove) in SPEC.md:
- Phase B task table (B8-B13) → New: B8 Inquiry Form, B9 Multi-item Quote Builder, B10 Quote PDF, B11 Quote Email, B12 Customer Portal, B13 Admin Inquiry Management
- B.2 Key Decisions (15 cart decisions) → New: Inquiry→Quote flow, Stock reservation on quote, Discount on quote vs invoice, Configuration pricing, Quote versioning
- B.3 Dependency Graph → Product → Inquiry Item → Quote → Order → Invoice → Payment
- B.4 Acceptance Criteria → 15+ new criteria for inquiry/quote
- B.5 Technical Approach → New architecture for inquiry/quote
- B.6 Open Questions → 8+ new questions
- Phase C Wishlist → "Saved Items for Quote Builder"
- API Endpoints → `POST /api/v1/inquiries`, `POST /api/v1/quotes`, `POST /api/v1/quotes/:id/convert`, `GET /api/v1/quotes/:id/pdf`
- Key Decisions Table → "Quote flow: Inquiry → Quote → Order"

---

## 5. Migration Safety — High Risk, No Rollback Plan

### Current Analysis Gap
> "Check if tables exist, drop if so" → **Medium risk**

### Actual Risk: HIGH
```sql
-- Production Supabase may have (not in migration 001):
-- 1. carts, cart_items tables from earlier migrations
-- 2. FK: order_items.cart_id REFERENCES carts(id) -- unlikely but possible
-- 3. FK: customers.last_cart_id REFERENCES carts(id)
-- 4. RLS policies on carts/cart_items
-- 5. Triggers: on cart_item insert → reserve stock
-- 6. Edge Functions: send_abandoned_cart_email, merge_guest_cart
-- 7. Realtime subscriptions on carts table
```

### Required Migration Safety Protocol
```sql
-- 1. AUDIT FIRST (run in Supabase SQL editor)
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name IN ('carts','cart_items') OR ccu.table_name IN ('carts','cart_items'));

-- 2. CHECK RLS POLICIES
SELECT * FROM pg_policies WHERE tablename IN ('carts','cart_items');

-- 3. CHECK TRIGGERS
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('carts','cart_items');

-- 4. CHECK EDGE FUNCTIONS (manual review in dashboard)

-- 5. ONLY THEN: DROP with CASCADE (if safe)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;

-- 6. UPDATE order_analytics constraint (preserve data)
ALTER TABLE order_analytics 
DROP CONSTRAINT IF EXISTS order_analytics_event_type_check;

ALTER TABLE order_analytics 
ADD CONSTRAINT order_analytics_event_type_check 
CHECK (event_type IN (
  'view', 
  'inquiry_created', 
  'quote_requested', 
  'quote_sent', 
  'quote_accepted', 
  'quote_rejected', 
  'order_complete', 
  'search'
));
```

### Rollback Plan: **Does not exist in analysis.** Must create:
1. Point-in-time recovery (PITR) enabled on Supabase (verify)
2. Migration script with `BEGIN`/`COMMIT` and `ROLLBACK` on error
3. Down migration SQL file committed to repo
4. Test on staging Supabase branch before production

---

## 6. Scalability/Extensibility — Inquiry/Quote Model for B2B & High-AOV

### Current Analysis: "Keep orders for inquiry flow" — **Insufficient**

### Malaysian Oak Furniture Requirements
| Requirement | Cart Model | Inquiry/Quote Model (Required) |
|-------------|------------|--------------------------------|
| **Configurable products** | Cart item: product_id + qty | Inquiry item: product_id + qty + `configuration` JSONB (finish, dimensions, hardware, joinery) |
| **Unique slabs (one-of-a-kind)** | Cart reserves on add | Quote reserves on quote_sent (longer hold: 7-30 days) |
| **B2B / Trade pricing** | Single price tier | Customer `pricing_tier` → quote applies tiered pricing |
| **Multi-item quotes** | Cart = implicit collection | Explicit Quote Builder UI (save, duplicate, share) |
| **Quote versioning** | N/A | Quotes table with `version`, `pdf_url`, `valid_until` |
| **Negotiation workflow** | N/A | Inquiry status: `negotiating` → sales rep notes → revised quote |
| **Deposit/partial payment** | Full payment at checkout | Quote → Invoice → Deposit (50%) → Balance on delivery |
| **Showroom integration** | N/A | Inquiry source: `online` / `showroom` / `referral` |
| **Installation scheduling** | N/A | Quote includes `installation_date`, `installation_team` |

### Scalability Concerns
- **Quote PDF generation**: Must be async (Edge Function + R2), not blocking API response
- **Stock reservation**: Move from cart-level (15 min) to quote-level (7-30 days) → requires `stock_reservations` table with `expires_at`, `inquiry_id`, `product_id`, `quantity`
- **Search/Recommendations**: Meilisearch ranking uses `cart_popularity` → must switch to `inquiry_count`, `quote_conversion_rate`
- **Admin scale**: `/admin/orders` pagination/filtering assumes order status enum → inquiry status enum has 7+ states, needs new filters

---

## 7. Verification Gaps — Unverified Claims Against Codebase

| Analysis Claim | Verification Status | Required Check |
|----------------|---------------------|----------------|
| "No `CartProvider`, `CartDrawer`, `useCart` components" | ✅ Verified via grep | `grep -r "CartProvider\|useCart\|CartContext\|CartDrawer" src/` |
| "No `src/lib/actions/cart.ts` Server Actions" | ✅ Verified | `ls src/lib/actions/` |
| "No cart API routes" | ✅ Verified | `ls src/app/api/` |
| "Migration 001 doesn't create `carts`/`cart_items`" | ✅ Verified | `grep -n "carts\|cart_items" supabase/migrations/001_initial_schema.sql` |
| "`discount_codes` table exists" | ✅ Verified | `grep -n "discount_codes" supabase/migrations/001_initial_schema.sql` |
| "`orders`/`order_items`/`customers` tables exist" | ✅ Verified | `grep -n "CREATE TABLE" supabase/migrations/001_initial_schema.sql` |
| "Analytics engine has cart funnel logic" | ✅ Verified | `grep -n "getConversionFunnel" src/lib/analytics/engine.ts` |
| "SPEC.md has extensive cart content" | ✅ Verified | `grep -n -i "cart\|checkout" SPEC.md \| wc -l` |
| "No `cart` imports remain in frontend" | ❌ **UNVERIFIED** | `grep -r "cart" src/app src/components src/lib --include="*.tsx" --include="*.ts" \| grep -v "carton\|Carton"` |
| "Middleware has no cart logic" | ❌ **UNVERIFIED** | `grep -n "cart" src/middleware.ts` |
| "No Edge Functions reference cart tables" | ❌ **UNVERIFIED** | `grep -rn "cart" supabase/functions/` |
| "No email templates reference cart/checkout" | ❌ **UNVERIFIED** | `grep -ri "cart\|checkout" src/lib/emails/` |
| "No dead Stripe/cart deps in package.json" | ❌ **UNVERIFIED** | `grep -i "stripe\|cart\|checkout" package.json` |
| "Admin orders page uses cart icons" | ❌ **UNVERIFIED** | `grep -n "ShoppingCart" src/app/admin/(admin)/orders/page.tsx` |
| "SPEC.md line counts accurate" | ❌ **UNVERIFIED** | `sed -n '195,206p' SPEC.md` (and all other cited ranges) |
| "`order_analytics` constraint includes `search`" | ❌ **UNVERIFIED** | `grep -n "event_type_check" supabase/migrations/001_initial_schema.sql` |

---

## Revised Recommendation — Correct Sequence

### ❌ DO NOT PROCEED with Phases 1-3 as "immediate cleanup"
The cleanup is trivial but the **replacement design is missing**. Cleaning up without a design creates a vacuum that will require rework.

### ✅ CORRECT SEQUENCE

#### Phase 0: Design Inquiry/Quote System (2-3 weeks, parallel tracks)
```
Track A: Business Flow Design
  ├─ Inquiry → Quote → Order → Invoice → Payment state machine
  ├─ Multi-item Quote Builder UX (replaces cart drawer)
  ├─ Stock reservation on quote (7-30 days, not 15 min)
  ├─ Discount application: quote-header vs quote-line
  ├─ Configuration pricing engine (finish × dimension × hardware)
  ├─ B2B: trade pricing tiers, net-30 terms, deposit rules
  └─ Showroom integration: walk-in → inquiry → quote

Track B: Technical Architecture
  ├─ New tables: inquiries, inquiry_items, quotes, stock_reservations
  ├─ API: POST /inquiries, POST /quotes, POST /quotes/:id/convert, GET /quotes/:id/pdf
  ├─ Admin: rebuild /admin/orders → /admin/inquiries with new status enum, filters
  ├─ Email: 5 new templates (inquiry_confirm, quote_sent, quote_accepted, invoice, payment_request)
  ├─ Analytics: new funnel events, Meilisearch ranking signals
  └─ SPEC.md: Full Phase B rewrite (replace, not remove)

Track C: Migration Safety
  ├─ Audit production Supabase for cart tables, FKs, RLS, triggers, Edge Functions
  ├─ Design soft migration (new tables, preserve orders for audit)
  ├─ Write up/down migrations with transaction safety
  ├─ Test on Supabase branching
  └─ Rollback plan with PITR verification
```

#### Phase 1: Execute Cleanup (Informed by Design)
- Frontend: Replace "Add to Cart" → "Add to Quote" (not "Inquire" — implies single item)
- Analytics: Implement new inquiry funnel events
- SPEC.md: Deploy rewritten Phase B
- Middleware: Remove cart cookie handling
- Package.json: Remove dead deps

#### Phase 2: Discount Codes Decision (Business-Led)
- **Option A (Keep → Redesign)**: Quote-level discounts, tiered pricing, validity windows
- **Option B (Remove)**: Clean admin UI, accept Phase A sunk cost
- **Option C (Repurpose)**: Promotion codes for showroom bookings, not quote discounts
- **Recommendation**: Option A for high-AOV configurable — discount negotiation is core to B2B furniture sales

---

## Final Scorecard — Analysis vs. Reality

| Dimension | Analysis Score | Reality Score | Delta |
|-----------|----------------|---------------|-------|
| **Completeness** | 4/10 (claimed 8/10) | 3/10 | Missed middleware, DB FKs, admin rebuild, email, Edge Functions, deps |
| **Accuracy** | 5/10 (claimed 9/10) | 4/10 | Unverified claims: middleware, SPEC.md line counts, email templates, deps |
| **Risk Assessment** | 4/10 (claimed 7/10) | 2/10 | DB=High not Medium; Discount=High not Decision; Analytics=Medium not Low |
| **Business Logic** | 3/10 (claimed 6/10) | 2/10 | Missed multi-item quote, stock reservation, B2B, configuration pricing |
| **Feasibility** | 4/10 (claimed 8/10) | 3/10 | Phase 3 effort 4x underestimated; Phase 4 risk understated |
| **SPEC.md Alignment** | 2/10 (claimed 5/10) | 1/10 | Treats SPEC.md as cleanup target, not redesign target |

---

## Sign-Off

**This analysis documents the current state accurately but misdiagnoses the problem as "cleanup" when it is "architectural redesign."** 

The Lotten project cannot ship a high-AOV configurable furniture site with an "Inquire" button and no quote builder. The cart removal is complete; the **inquiry/quote system design must begin immediately** before any cleanup proceeds.

**Recommendation: Pause Phases 1-3. Initiate Phase 0 Design Sprint (2-3 weeks).** The cleanup will fall out naturally from the new design.

---

*Software Architect Review completed: 2026-07-29*  
*Reviewer: Senior Software Architect — Lotten Project*