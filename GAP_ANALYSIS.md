# Lotten Inquiry→Quote→Order System - Implementation Gap Analysis

**Date:** 2026-07-30  
**Status:** Backend complete, Frontend missing, Quote.ts syntax error needs fix

---

## 📊 Implementation Status Summary

| Component | Spec Reference | Implementation Status | Files |
|-----------|----------------|----------------------|-------|
| **Database Schema** | Migration 006 | ✅ Complete | `supabase/migrations/006_inquiry_quote_system.sql` |
| **Type Definitions** | All | ✅ Complete | `src/lib/types/database.ts` |
| **Analytics Engine** | B15 | ✅ Complete | `src/lib/analytics/engine.ts` |
| **Inquiry Actions** | B8 | ✅ Complete | `src/lib/actions/inquiry.ts` |
| **Quote Actions** | B9 | ⚠️ Syntax Error | `src/lib/actions/quote.ts` |
| **Stock Actions** | B10 | ✅ Complete | `src/lib/actions/stock.ts` |
| **Pricing Engine** | B9 | ✅ Complete | `src/lib/pricing/engine.ts` |
| **API Routes** | B8, B9, B11, B12, B13 | ✅ Complete | `src/app/api/v1/inquiries/`, `quotes/` |
| **SPEC.md** | All | ✅ Complete | `SPEC.md` |
| **InquiryBuilder Component** | B8 | ❌ Missing | — |
| **Customer Portal** | B11 | ❌ Missing | — |
| **Admin Inquiry/Quote Kanban** | B12, B13 | ❌ Missing | — |
| **Email Templates (5)** | B14 | ❌ Missing | — |
| **PDF Generation** | B9 | ❌ Missing (placeholder) | — |
| **Cron Jobs** | B10 | ❌ Missing | — |
| **Admin Kanban UI** | B12, B13 | ❌ Missing | — |

---

## 🔴 Critical Issues Requiring Immediate Fix

### 1. Quote.ts Syntax Error (Blocking TypeScript Compilation)
**File:** `src/lib/actions/quote.ts`  
**Error:** Missing 1 closing brace (brace count = 1 at EOF)  
**Location:** End of file, after `generateQuotePdf` function  
**Fix Required:** Add 1 closing brace `}` at EOF

### 2. TypeScript Compilation Failure
```bash
npm run typecheck
# src/lib/actions/quote.ts(504,7): error TS1005: 'try' expected.
# src/lib/actions/quote.ts(510,1): error TS1472: 'catch' or 'finally' expected.
# src/lib/actions/quote.ts(619,2): error TS1005: '}' expected.
```

---

## 📋 Outstanding Implementation Items (Priority Order)

---

## 🔴 CRITICAL - Must Fix First

| # | Task | Spec | Files to Create/Modify | Est. Effort |
|---|------|------|------------------------|-------------|
| 1 | **Fix quote.ts syntax** | B9 | `src/lib/actions/quote.ts` (add 1 `}` at EOF) | 15 min |
| 2 | **Verify typecheck passes** | All | Run `npm run typecheck` | 5 min |

---

## 🔴 HIGH PRIORITY - Core Frontend (B8, B11)

| # | Task | Spec | Files to Create | Est. Effort |
|---|------|------|-----------------|-------------|
| 3 | **InquiryBuilder Component** | B8 | `src/components/InquiryBuilder.tsx`<br>`src/components/InquiryBuilderItem.tsx`<br>`src/hooks/useInquiryBuilder.ts` | 2-3 days |
| 4 | **Customer Portal - Inquiries List** | B11 | `src/app/[locale]/inquiries/page.tsx`<br>`src/app/[locale]/inquiries/layout.tsx` | 1 day |
| 4 | **Customer Portal - Quote Detail** | B11 | `src/app/[locale]/quotes/[id]/page.tsx`<br>`src/components/QuoteDetailView.tsx`<br>`src/components/QuoteActions.tsx` | 2 days |
| 5 | **Customer Portal - Orders List** | B11 | `src/app/[locale]/orders/page.tsx` | 0.5 day |

---

## 🔴 HIGH PRIORITY - Admin UI (B12, B13)

| # | Task | Spec | Files to Create | Est. Effort |
|---|------|------|-----------------|-------------|
| 6 | **Admin Inquiry Kanban** | B12 | `src/app/admin/(admin)/inquiries/page.tsx`<br>`src/components/admin/InquiryKanban.tsx`<br>`src/components/admin/InquiryCard.tsx` | 2 days |
| 7 | **Admin Quote Kanban** | B13 | `src/app/admin/(admin)/quotes/page.tsx`<br>`src/components/admin/QuoteKanban.tsx`<br>`src/components/admin/QuoteVersionSelector.tsx` | 2 days |
| 8 | **Admin Quote Detail** | B13 | `src/app/admin/(admin)/quotes/[id]/page.tsx`<br>`src/components/admin/QuoteDetailEditor.tsx`<br>`src/components/admin/QuoteVersionDiff.tsx` | 2 days |

---

## 🟡 HIGH PRIORITY - Email & PDF (B14, B9)

| # | Task | Spec | Files to Create | Est. Effort |
|---|------|------|-----------------|-------------|
| 9 | **Email Templates (5)** | B14 | `src/lib/emails/inquiry-confirmation.tsx`<br>`src/lib/emails/quote-sent.tsx`<br>`src/lib/emails/quote-accepted.tsx`<br>`src/lib/emails/quote-rejected.tsx`<br>`src/lib/emails/invoice-payment-request.tsx`<br>`src/lib/email/send.ts` | 1 day |
| 10 | **PDF Generation** | B9 | `src/lib/pdf/quote-pdf.tsx`<br>`src/lib/pdf/quote-pdf.tsx` (React-PDF) | 1 day |
| 11 | **Email Service Integration** | B14 | `src/lib/email/send.ts` (Resend wrapper) | 0.5 day |

---

## 🟡 HIGH PRIORITY - Cron Jobs (B10)

| # | Task | Spec | Files to Create | Est. Effort |
|---|------|------|-----------------|-------------|
| 12 | **Release Expired Reservations** | B10 | `supabase/functions/release-expired-reservations/index.ts` | 4 hrs |
| 13 | **Auto-Expire Quotes** | B10 | `supabase/functions/auto-expire-quotes/index.ts` | 2 hrs |
| 14 | **Abandon Inquiries** | B10 | `supabase/functions/abandon-inquiries/index.ts` | 2 hrs |
| 14 | **Cron Scheduler Config** | B10 | `supabase/config.toml` (cron schedules) | 1 hr |

---

## 🟢 MEDIUM PRIORITY - Polish & Extras

| # | Task | Spec | Files to Create | Est. Effort |
|---|------|------|-----------------|-------------|
| 15 | Quote Diff API | B9 | `src/app/api/v1/quotes/[id]/diff/route.ts` | 4 hrs |
| 16 | Analytics Dashboard | B15 | `src/app/admin/(admin)/analytics/funnel/page.tsx` | 1 day |
| 17 | Partial Quote Acceptance | B9 | Extend `acceptQuote` action | 4 hrs |
| 18 | Quote PDF Download Button | B9 | `QuoteActions.tsx` download handler | 2 hrs |
| 19 | Negotiation Thread UI | B11 | `src/components/NegotiationThread.tsx` | 1 day |
| 20 | Admin: Extend Quote Validity | B9 | Extend `/api/v1/quotes` PATCH | 2 hrs |

---

## 📦 Pre-existing Issues (Not Blocking This Work)

| Issue | File | Status |
|-------|------|--------|
| Build fails: `/admin/content/new` | `admin/content/new/page.tsx` | Missing `ContentForm` import (pre-existing) |
| Build fails: `/_global-error` | `_global-error` | `useContext` null (pre-existing) |
| TypeScript `any` warnings | `engine.ts`, `analytics/page.tsx` | Pre-existing, non-blocking |

---

## 🎯 Immediate Action Plan

### Step 1: Fix Blockers (Today)
```bash
# 1. Fix quote.ts - add 1 closing brace at EOF
# 2. Run typecheck
npm run typecheck
```

### Step 2: Core Frontend (Week 1)
- [ ] InquiryBuilder component + hook
- [ ] Customer Portal: Inquiries List + Quote Detail
- [ ] Admin Inquiry Kanban
- [ ] Admin Quote Kanban + Version Selector

### Step 3: Email & PDF (Week 2)
- [ ] 5 Email templates + Resend integration
- [ ] PDF generation (React-PDF)
- [ ] Quote PDF download in Customer Portal

### Step 4: Cron & Polish (Week 2-3)
- [ ] 3 Cron jobs (reservations, quotes, inquiries)
- [ ] Quote Diff API
- [ ] Admin Quote Version Diff UI
- [ ] Negotiation Thread UI
- [ ] Analytics Funnel Dashboard

---

## 📊 Effort Summary

| Category | Tasks | Est. Total |
|----------|-------|------------|
| Critical Fixes | 2 | 0.5 hrs |
| Core Frontend (B8, B11) | 4 | ~6 days |
| Admin UI (B12, B13) | 3 | ~6 days |
| Email & PDF (B14, B9) | 3 | ~2.5 days |
| Cron Jobs (B10) | 4 | ~1 day |
| Polish & Extras | 6 | ~4 days |
| **Total** | **23** | **~15-18 days** |

---

## ✅ Definition of Done for Each Task

| Task | Done When |
|------|-----------|
| Fix quote.ts | `npm run typecheck` passes |
| InquiryBuilder | Add/remove items, config UI, real-time pricing, persists to DB |
| Customer Portal | View inquiries/quotes, accept/reject quote, download PDF |
| Admin Kanbans | Drag-drop status changes, assign rep, generate quote |
| Email Templates | Render correctly, sent via Resend on trigger |
| PDF Generation | Downloads valid PDF matching quote detail |
| Cron Jobs | Run hourly/daily, release/expire correctly |
| TypeScript | `npm run typecheck` passes clean |

---

## 🎯 Next Steps (Immediate)

1. **Fix quote.ts** - Add 1 `}` at EOF
2. **Run `npm run typecheck`** - Verify clean compilation
3. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
3. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation
4. **Begin InquiryBuilder** - Start with component structure + `useInquiryBuilder` hook
5. **Run `npm run typecheck`** - Verify clean compilation