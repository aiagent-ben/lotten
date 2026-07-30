# Task for fcc-claude: Complete Inquiry→Quote→Order System Implementation

## Context
The cart/checkout system has been removed and replaced with an **Inquiry → Quote → Order** system for Malaysian Oak furniture (high-AOV, configurable). The database migration (006) and SPEC.md are complete. TypeScript types and analytics engine scaffold are in place.

**Current State:**
- ✅ Database migration (006_inquiry_quote_system.sql) — tables, atomic `accept_quote`, idempotent `release_expired_reservations`
- ✅ SPEC.md — B8-B15 tasks defined, decision tables updated
- ✅ Types (`src/lib/types/database.ts`) — Inquiry, Quote, QuoteItem, StockReservation, NegotiationThread, PricingRuleSnapshot
- ✅ Analytics engine scaffold — `trackEvent()` signature updated, funnel logic partially migrated
- ✅ UI cleanup — "Add to Quote" button, admin icons, funnel stages

## Tasks to Implement

### 1. Complete Analytics Funnel (src/lib/analytics/engine.ts)
**File:** `src/lib/analytics/engine.ts`

Add missing funnel queries to `getConversionFunnel()`:
- `quote_sent` → funnel step "Quote Sent"
- `quote_rejected` → funnel step "Quote Rejected" 
- `quote_expired` → funnel step "Quote Expired"

```typescript
// Add these queries inside getConversionFunnel():
const { count: quotesSent } = await supabase
  .from('order_analytics')
  .select('*', { count: 'exact', head: true })
  .eq('event_type', 'quote_sent')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());

const { count: quotesRejected } = await supabase
  .from('order_analytics')
  .select('*', { count: 'exact', head: true })
  .eq('event_type', 'quote_rejected')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());

const { count: quotesExpired } = await supabase
  .from('order_analytics')
  .select('*', { count: 'exact', head: true })
  .eq('event_type', 'quote_expired')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());
```

Update `quoteFunnelSteps` to include all 6 stages:
1. Quote Generated
2. Quote Sent
3. Quote Viewed
4. Quote Accepted
5. Quote Rejected
6. Quote Expired
7. Order Complete

---

### 2. Update Admin Analytics Page (src/app/admin/(admin)/analytics/page.tsx)
**File:** `src/app/admin/(admin)/analytics/page.tsx`

Update `funnelStages` to match new engine:
```typescript
const funnelStages = ['view', 'inquiry_started', 'quote_requested', 'quote_generated', 'quote_sent', 'quote_viewed', 'quote_accepted', 'quote_rejected', 'quote_expired', 'order_complete'];
```

Update the fetch logic to query all new event types and display 7-step funnel (Generated → Sent → Viewed → Accepted/Rejected/Expired → Order).

---

### 3. Fix Pre-existing Build Failure
**Files:** `/admin/content/new`, `/_global-error`

The build fails on these pages with `TypeError: Cannot read properties of null (reading 'useContext')`. This is a pre-existing issue unrelated to cart removal.

**Likely cause:** Missing provider context in layout or page component. Check:
- `src/app/admin/(admin)/content/new/page.tsx` — ensure all components have required providers
- `src/app/_global-error/page.tsx` — ensure error boundary has proper context

---

### 4. (Optional) Implement Core B8-B15 Actions
If time permits, scaffold the server actions:

| Task | File | Description |
|------|------|-------------|
| B8 | `lib/actions/inquiry.ts` | `createInquiry`, `addInquiryItem`, `updateInquiryItem`, `submitInquiry` |
| B9 | `lib/actions/quote.ts` | `generateQuote`, `reviseQuote`, `sendQuote`, `acceptQuote`, `rejectQuote` |
| B10 | `lib/actions/stock.ts` | `reserveStockForQuote`, `releaseExpiredReservations` |
| B14 | `lib/emails/*.tsx` | 5 React Email templates |
| B15 | `lib/analytics/engine.ts` | Complete (above) |

---

## Verification Commands
```bash
cd /opt/data/workspace/projects/lotten
npm run typecheck          # Must pass
npm run build              # Must pass (after fixing build failure)
npm run lint               # Check for new issues
```

## Key Files Reference
- Migration: `supabase/migrations/006_inquiry_quote_system.sql`
- Spec: `SPEC.md` (sections B8-B15, B.2, B.4, B.5)
- Types: `src/lib/types/database.ts` (lines 233-407)
- Analytics: `src/lib/analytics/engine.ts`
- Admin UI: `src/app/admin/(admin)/analytics/page.tsx`

## Environment
- Proxy: `fcc-server` running on localhost:8082 (NVIDIA NIM)
- Auth: `ANTHROPIC_BASE_URL=http://localhost:8082 ANTHROPIC_AUTH_TOKEN=***`
- Database: Supabase (migration 006 applied)
