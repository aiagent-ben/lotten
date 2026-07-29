# Shopping Cart Removal - Implementation Plan

## Executive Summary
The Lotten project currently has **cart infrastructure in place** (CartProvider, CartDrawer, CartContext, API routes) but the **cart UI is not integrated** into the Header or any page. The project appears to be in **Phase B** (Catalog + Cart/Checkout) but the cart is effectively dormant.

**Decision:** Remove all cart-related code since the business requirement states "we do not need shopping cart."

---

## Current Cart Infrastructure (to be removed)

### 1. Context & Provider Files
| File | Description | Lines |
|------|-------------|-------|
| `src/components/CartProvider.tsx` | localStorage-based cart state with context | 200+ |
| `src/components/CartDrawer.tsx` | Slide-out cart UI with quantity controls | 400+ |
| `src/components/cart/` | Cart-related components directory | Multiple |

### 2. API Routes (Server Actions)
| File | Description |
|------|-------------|
| `src/app/api/cart/route.ts` | GET/POST cart operations |
| `src/app/api/checkout/route.ts` | Checkout processing |
| `src/lib/actions/cart.ts` | Server Actions for cart (mergeCartOnLogin, etc.) |

### 3. Database Schema (Supabase)
| Table | Description |
|-------|-------------|
| `carts` | User cart persistence (referenced in `mergeCartOnLogin`) |
| `cart_items` | Line items for user carts |
| `orders` | Order processing (depends on cart) |

### 4. Types & Utilities
| File | Cart-related exports |
|------|---------------------|
| `src/lib/types/database.ts` | Cart, CartItem, Order types |
| `src/lib/utils.ts` | `parseCartonDimensions` (used in cart/checkout) |

### 5. UI Components (Dead Code)
| File | Status |
|------|--------|
| `src/components/CartProvider.tsx` | ❌ Not imported anywhere |
| `src/components/CartDrawer.tsx` | ❌ Not imported anywhere |
| `src/components/CartProvider.tsx` (alt) | ❌ Duplicate implementation |
| `src/app/[locale]/checkout/` | ❌ Directory deleted per pending_tasks.md |

---

## Current Header State (No Cart)

The `Header.tsx` component **already lacks cart integration**:

```tsx
// Current Header.tsx - Right side only has LocaleSwitcher
<div className="flex items-center space-x-4">
  <LocaleSwitcher />
</div>
```

**Missing:** Cart icon, item count badge, CartDrawer trigger.

---

## Home Page Duplicate Navigation (Bug)

**Critical Issue:** The home page (`/app/[locale]/page.tsx`, lines 19-40) has its **own hardcoded navigation bar** that duplicates the shared `Header` component:

```tsx
// In /app/[locale]/page.tsx - DUPLICATE NAV BAR
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/90...">
  <Link href="/">Lotten</Link>
  <nav className="hidden md:flex items-center gap-8">
    <Link href="/products">Shop</Link>
    <Link href="/collections">Collections</Link>
    <Link href="/about">Our Story</Link>
    <Link href="/contact">Contact</Link>
  </nav>
  {/* ... locale switcher, search icon */}
</nav>
```

This causes:
- **Two nav bars** on home page (Header + hardcoded nav)
- **Inconsistent UX** across pages
- **Layout shift** when navigating to/from home

---

## Required Changes

### 1. Remove Cart Infrastructure (All)
```bash
# Context & UI
rm src/components/CartProvider.tsx
rm src/components/CartDrawer.tsx
rm -rf src/components/cart/

# API Routes
rm -rf src/app/api/cart/
rm -rf src/app/api/checkout/

# Server Actions
rm src/lib/actions/cart.ts
```

### 2. Remove Cart Types from Database Types
Edit `src/lib/types/database.ts`:
- Remove `Cart` interface
- Remove `CartItem` interface  
- Remove `Order` interface (if not used for order tracking)
- Remove `OrderItem` interface
- Remove `OrderStatus` type
- Remove `OrderAnalyticsEventType` cart events (`'add_to_cart'`, `'checkout_start'`)

### 3. Remove Database Tables (Migration)
```sql
-- supabase/migrations/XXX_remove_cart_tables.sql
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
```

### 4. Fix Home Page Duplicate Navigation
**File:** `src/app/[locale]/page.tsx`
**Change:** Remove lines 19-40 (the entire `<nav>` block with duplicate navigation)

The home page will then use the shared `Header` component from the layout.

### 5. Clean Up Dead References
```bash
# Search and remove any remaining imports
grep -r "CartProvider\|CartDrawer\|useCart" src/
```

---

## Impact Assessment

| Area | Impact | Effort |
|------|--------|--------|
| Header | ✅ Already cart-free | None |
| Home page | ❌ Duplicate nav | Low (remove 20 lines) |
| Product pages | ✅ No cart buttons | None |
| Collections | ✅ No cart | None |
| Search/About/Contact | ✅ No cart | None |
| Database | Cart tables exist | Low (1 migration) |
| API routes | Exist but unused | Low (delete folders) |
| Type definitions | Cart types exist | Low (cleanup) |

---

## Recommended Action Plan

### Phase 1: Remove Cart Code (30 min)
1. Delete cart context, drawer, API routes
2. Remove cart types from database.ts
2. Create migration to drop cart tables

### Phase 2: Fix Home Page (10 min)
1. Remove duplicate nav bar from home page
2. Verify Header renders correctly on home page

### Phase 3: Verify & Deploy (10 min)
1. `npm run build` - ensure no broken imports
2. `npm run typecheck` - ensure no type errors
3. Test all pages: `/`, `/products`, `/collections`, `/products/[slug]`, `/about`, `/contact`

---

## Files to Modify/Delete

### Delete Entirely
- [ ] `src/components/CartProvider.tsx`
- [ ] `src/components/CartDrawer.tsx`
- [ ] `src/components/cart/` (entire directory)
- [ ] `src/app/api/cart/` (entire directory)
- [ ] `src/app/api/checkout/` (entire directory)
- [ ] `src/lib/actions/cart.ts`

### Modify
- [ ] `src/lib/types/database.ts` - Remove cart/order types
- [ ] `src/app/[locale]/page.tsx` - Remove duplicate nav (lines 19-40)
- [ ] `supabase/migrations/XXX_remove_cart_tables.sql` - New migration

### Verify Clean
- [ ] No `CartProvider` imports in codebase
- [ ] No `CartDrawer` imports in codebase
- [ ] No `useCart` imports in codebase
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes