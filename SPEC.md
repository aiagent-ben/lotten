# Direct-to-Consumer Furniture Marketplace — Architecture & Product Requirements

> **Status:** Draft v0.3 | **Last Updated:** 2026-07-14 | **Owner:** [Team]

---

## 1. Executive Summary

**Product:** Direct-to-consumer furniture marketplace for Malaysian Oak furniture  
**Target Users:** Homeowners, renters, small offices, interior enthusiasts  
**Core Value:** Curated catalog, transparent specs, displayed pricing with cart/checkout, flexible delivery  
**Current State:** Next.js 14 static site with 107 products, 20 collections, 5 brands — all client-rendered

---

## 2. Current Architecture Analysis

### 2.1 Tech Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | Next.js | 14.2.x | App Router |
| Language | TypeScript | 5.4.x | Strict mode |
| Styling | Tailwind CSS | 3.4.x | Custom design system |
| Data | Static JSON → TS | `lib/products.ts` | 260KB bundle |
| Scraping | Playwright + Python | 3.x / 3.11 | `scripts/scrape_products.py` |
| Cleaning | Pydantic + Python | 2.x | `scripts/clean_products.py` |
| Deploy | Standalone output | `next.config.js` | Docker/Nixpacks ready |

### 2.2 Data Pipeline

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ b2bfurniture│────▶│  Playwright      │────▶│  clean_products │────▶│  lib/products.ts │
│  supply.com │     │  Scraper         │     │  .py (Pydantic) │     │  (TypeScript)    │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
                                                                         │
                                                                         ▼
                                                                ┌──────────────────┐
                                                                │  Next.js Build   │
                                                                │  (Static Export) │
                                                                └──────────────────┘
```

**Schedule:** Manual (`npm run scrape && npm run clean:products && npm run build`)

### 2.3 Page Inventory

| Route | Type | Data Source | Components |
|-------|------|-------------|------------|
| `/` | Client | `lib/products.ts` | Hero, Collections, Featured Products, Trust, CTA, Footer |
| `/products` | Client | `lib/products.ts` | Filters (collection, category, search), Grid/List view, Pagination |
| `/products/[slug]` | Client | `lib/products.ts` | Gallery, Specs tabs, Related products |
| `/collections` | Client | Hardcoded `collectionsData` | Brand overview, Collection cards, CTA |
| `/collections/[slug]` | Client | `lib/products.ts` filtered | Hero, Product grid |

### 2.4 Data Model (Current)

```typescript
interface Product {
  id: string;              // Article number (e.g., "335048")
  name: string;            // "BREDA 1.5M TV CABINET 109/167"
  slug: string;            // "breda-15m-tv-cabinet-109167"
  image: string;           // Primary image URL (hinlim.com)
  images: string[];        // All gallery images
  price: string;           // Always "Contact for Price"
  collection: string;      // "Breda (NestHouZ)"
  description?: string;    // Rich text from detail page
  materials?: string;      // Raw text block
  colors?: string;         // Raw text block
  specifications?: string; // Raw text block
  dimensions?: string;     // "W1500 D450 H500"
  weight?: string;         // "33.30 kg"
  cartonDimensions?: string;
  articleNo?: string;      // Same as id
}
```

---

## 3. Product Requirements (PRD) — Revised

### 3.1 User Personas

| Persona | Goals | Pain Points |
|---------|-------|-------------|
| **Homeowner / Home Decorator** | Browse curated furniture, visualize in space, easy checkout, flexible delivery | Hard to judge scale/finish online, delivery uncertainty, no easy returns |
| **Renter / Young Professional** | Affordable style, quick delivery, easy assembly, budget-friendly | Limited budget, small spaces, temporary living |
| **Small Business / Home Office** | Functional furniture, professional look, bulk discounts, tax invoice | Need durability, professional appearance, business expense tracking |
| **Interior Design Enthusiast** | Curated collections, inspiration, spec sheets, style guides | Hard to find cohesive looks, scattered information |

### 3.2 Core Features (Revised Priority Order)

#### **Phase A: Admin Panel + Foundation (Week 1-3)** — *Build First*
- [ ] **Admin authentication** (Supabase Auth, role: admin)
- [ ] **Product CRUD** (all fields, rich text, structured specs, images → R2)
- [ ] **Product variants** (fabric/finish = separate SKU)
- [ ] **Site-wide settings** (pricing display, stock visibility, maintenance mode, SEO, currency, free shipping threshold)
- [ ] **Promotion engine** (coupons, bundles, flash sales, first-order discount, buy X get Y)
- [ ] **Discount codes** (percentage/fixed, min order, usage limits, expiry, auto-apply)
- [ ] **Customer management** (view, edit, activate/deactivate, loyalty points, birthday)
- [ ] **Order management** (Kanban: pending → paid → shipped → delivered → cancelled)
- [ ] **Inventory tracking** (single pool: available, reserved, incoming)
- [ ] **Review moderation** (approve/reject, feature review)
- [ ] **Content management** (blog posts, care guides, lookbooks — MDX)
- [ ] **Shipping rules** (free shipping threshold, zones, flat rate)
- [ ] **Loyalty program admin** (points rules, tiers, expiry)
- [ ] **Analytics dashboard** (view→order funnel, top products, revenue, conversion rate, AOV, repeat customer rate, cart abandonment)

#### **Phase B: Public Catalog + Cart/Checkout (Week 3-5)**
- [x] **Server-rendered catalog** with ISR (SEO, performance)
- [x] **Product detail pages** with structured specs (dimensions, materials, finishes)
- [x] **Collection browsing** with brand storytelling
- [x] **Image optimization** (Next.js Image, WebP/AVIF, blur placeholders)
- [x] **Recently viewed products** (cookie-based, 20 items, carousel on home/product page)

#### **Phase X: Cart, Checkout & Customer Features (Deferred)**
- [ ] **Cart + Checkout** (displayed price, discount code field, guest checkout, save for later)
- [ ] **Mini cart drawer** (not full page redirect)
- [ ] **Installment payments** (Atome, GrabPayLater, FPX)
- [ ] **Customer authentication** (email/password, magic link, social login: Google, Apple)
- [ ] **Guest checkout** (email + phone, optional account creation post-purchase)
- [ ] **Customer dashboard** (order history, wishlist, recently viewed, loyalty points, profile, easy reorder)
- [ ] **Wishlist / Save for later** (persistent, shareable, price drop alerts)
- [ ] **Product reviews display** (stars, photos, verified purchase badge)
- [ ] **Discount codes** (validation API, checkout UI, admin UI exists)
- [ ] **Reviews & Q&A** (verified purchase, photos, helpful votes, seller response)
- [ ] **Wishlist + save for later + alerts** (persistent, shareable, price drop/back-in-stock emails)

#### **Phase C: Discovery & Inspiration (Week 5-7)**
- [ ] **Search & filter** (Meilisearch: collection, category, material, finish, dimensions, price, room type, style)
- [ ] **Product compare** (side-by-side specs, max 4, shareable URL)
- [ ] **Lookbooks / room inspiration** (curated sets, shoppable hotspots, "shop the room")
- [ ] **Smart recommendations** ("Complete the look", "Customers also bought", recently viewed)
- [ ] **Content hub** (care guides, styling tips, trend articles, lookbooks; MDX-based)
- [ ] **360° viewer + AR "view in room"** (deferred to Phase D+)

#### **Phase D: Operations, Loyalty & Scale (Week 7-10)**
- [ ] **Inventory availability** (real-time stock badges, lead times)
- [ ] **Logistics calculator** (shipping estimates, flat rate + free shipping threshold)
- [ ] **Returns & exchanges flow** (self-service, labels, tracking)
- [ ] **Loyalty program** (points earning/redemption, tiers, referral program)
- [ ] **Multi-language** (EN, ZH, MY)
- [ ] **Headless API** (mobile app, future integrations)
- [ ] **Analytics & personalization** (conversion funnels, cohort analysis, product recommendations API)

### 3.3 Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | LCP (Product Detail) | < 2.5s |
| | TTI (Catalog) | < 3.5s |
| | Bundle size (JS) | < 150KB gzipped |
| **SEO** | Product pages indexable | 100% |
| | Structured data (Product, Breadcrumb) | Valid |
| **Accessibility** | WCAG 2.1 AA | Pass |
| **Reliability** | Uptime | 99.9% |
| | Build time | < 10 min |
| **Security** | CSP headers | Strict |
| | Rate limiting (checkout API) | 10/min/IP |

---

## 4. Target Architecture (Post-Refactor)

### 4.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Web (Next.js)│  │  Mobile PWA  │  │  Admin Dash  │  │  API Clients │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE / CDN (Vercel/Cloudflare)                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ISR Cache (HTML)  │  Image Optimization  │  API Rate Limiting     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS APPLICATION (SERVER)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  App Router  │  │  Server      │  │  API Routes  │  │  Middleware  │   │
│  │  (RSC/ISR)   │  │  Actions     │  │  (REST)      │  │  (Auth, i18n)│   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │  Redis       │  │  Blob Store  │  │  Search      │   │
│  │  (Supabase)  │  │  (Cache/Sess)│  │  (R2)        │  │  (Meilisearch)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKGROUND JOBS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Scraper     │  │  Data Sync   │  │  PDF Gen     │  │  Email/Notif │   │
│  │  (Playwright)│  │  (ERP/PIM)   │  │  (React-PDF) │  │  (Resend)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema (PostgreSQL/Supabase) — **Revised**

```sql
-- Core tables
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- 'NestNordic', 'Luooma', etc.
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- 'Breda', 'Dover', 'Ludlow'
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  color_palette JSONB,                 -- [{name: 'Cocoa', code: '109', hex: '#4A3728'}]
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_no TEXT NOT NULL UNIQUE,     -- '335048' (source of truth)
  collection_id UUID REFERENCES collections(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,                    -- Rich text (Markdown/HTML)
  short_description TEXT,              -- For cards/listings
  -- Physical specs
  width_mm INT,
  depth_mm INT,
  height_mm INT,
  weight_kg DECIMAL(8,2),
  volume_m3 DECIMAL(10,4),
  pack_type TEXT,                      -- '1PC/CTN'
  carton_length_mm INT,
  carton_width_mm INT,
  carton_height_mm INT,
  -- Materials & finishes (structured)
  materials JSONB,                     -- [{part: 'leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109'}]
  colors JSONB,                        -- [{part: 'body', name: 'Walnut', code: '113', hex: '#3D2B1F'}]
  -- Commercial (SIMPLIFIED: fixed price per product, no tiered pricing)
  price_usd DECIMAL(10,2) NOT NULL,    -- Single displayed price
  cost_usd DECIMAL(10,2),              -- Internal cost (admin only)
  moq INT DEFAULT 1,                   -- Minimum order quantity
  lead_time_weeks INT DEFAULT 8,
  -- Inventory (single pool)
  stock_available INT DEFAULT 0,
  stock_reserved INT DEFAULT 0,
  stock_incoming INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product variants (different fabric/finish = separate SKU)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  article_no TEXT NOT NULL UNIQUE,     -- Variant article number
  name TEXT NOT NULL,                  -- e.g., "Breda 1.5M TV Cabinet - Grey Fabric"
  slug TEXT NOT NULL UNIQUE,
  price_usd DECIMAL(10,2) NOT NULL,    -- Variant-specific price
  stock_available INT DEFAULT 0,
  stock_reserved INT DEFAULT 0,
  stock_incoming INT DEFAULT 0,
  variant_attributes JSONB,            -- {fabric: "Grey Linen", finish: "Natural Oak"}
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- B2C tables (SIMPLIFIED: no quotes, no tiered pricing)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,            -- Supabase auth.users.id
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  address JSONB,                       -- {line1, line2, city, state, postal_code, country}
  tax_id TEXT,                         -- VAT/GST number
  credit_limit_usd DECIMAL(12,2),
  payment_terms_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,   -- 'ORD-2026-001234'
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled'
  currency TEXT DEFAULT 'USD',
  subtotal_usd DECIMAL(12,2),
  discount_usd DECIMAL(12,2) DEFAULT 0,
  discount_code_id UUID,               -- Reference to discount_codes
  tax_usd DECIMAL(12,2),
  shipping_usd DECIMAL(12,2),
  total_usd DECIMAL(12,2),
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  delivered_date DATE,
  notes TEXT,                          -- Customer notes
  internal_notes TEXT,                 -- Admin notes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  unit_price_usd DECIMAL(10,2) NOT NULL,  -- Price at time of order
  line_total_usd DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discount codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- 'WHOLESALE10', 'WELCOME50'
  type TEXT NOT NULL,                  -- 'percentage', 'fixed_amount'
  value DECIMAL(10,2) NOT NULL,        -- 10 (for 10%) or 50 (for $50)
  min_order_usd DECIMAL(10,2) DEFAULT 0,
  max_uses INT,                        -- NULL = unlimited
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_tiers TEXT[],             -- Empty = all customers
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site-wide settings (single row, key-value JSONB)
CREATE TABLE site_settings (
  id INT PRIMARY KEY DEFAULT 1,        -- Single row enforced by PK
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initial site_settings row
INSERT INTO site_settings (id, settings) VALUES (1, '{
  "show_pricing": true,
  "show_stock": true,
  "maintenance_mode": false,
  "maintenance_message": "We are performing scheduled maintenance. Please check back soon.",
  "seo_defaults": {
    "site_title": "Oak & Home",
    "site_description": "Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.",
    "og_image": "/og-default.jpg"
  },
  "default_currency": "USD",
  "supported_currencies": ["USD"]
}') ON CONFLICT (id) DO NOTHING;

-- Search/Analytics
CREATE TABLE search_analytics (
  id BIGSERIAL PRIMARY KEY,
  query TEXT,
  filters JSONB,
  results_count INT,
  user_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_analytics (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,            -- 'view', 'add_to_cart', 'checkout_start', 'order_complete'
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  value_usd DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 TypeScript Types (Generated from DB)

```typescript
// types/database.ts (generated via supabase gen types)
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  color_palette: ColorOption[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface Product {
  id: string;
  article_no: string;
  collection_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  volume_m3: number | null;
  pack_type: string | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  materials: MaterialSpec[] | null;
  colors: ColorOption[] | null;
  price_usd: number;                    // Single displayed price
  cost_usd: number | null;              // Internal only
  moq: number;
  lead_time_weeks: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  collection?: Collection;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  article_no: string;
  name: string;
  slug: string;
  price_usd: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  variant_attributes: Record<string, string>;  // {fabric: "Grey Linen", finish: "Natural Oak"}
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialSpec {
  part: string;          // 'leg', 'body', 'top', 'drawer'
  material: string;      // 'Malaysian Oak', 'MDF+Ash Veneer', 'Melamine'
  finish: string;        // 'Cocoa', 'Natural', 'White Wash'
  code: string;          // '109', '102', '111'
}

export interface ColorOption {
  part: string;
  name: string;
  code: string;
  hex: string;           // For UI color swatches
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
}

export interface Customer {
  id: string;
  auth_user_id: string | null;
  email: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  address: Address | null;
  tax_id: string | null;
  credit_limit_usd: number | null;
  payment_terms_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled';
  currency: string;
  subtotal_usd: number | null;
  discount_usd: number;
  discount_code_id: string | null;
  tax_usd: number | null;
  shipping_usd: number | null;
  total_usd: number | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_ship_date: string | null;
  actual_ship_date: string | null;
  delivered_date: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_usd: number;
  line_total_usd: number;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_order_usd: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applicable_tiers: string[];
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  show_pricing: boolean;
  show_stock: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  seo_defaults: {
    site_title: string;
    site_description: string;
    og_image: string;
  };
  default_currency: string;
  supported_currencies: string[];
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}
```

---

## 5. Migration Strategy (Phased — Admin First)

### **Phase A: Admin Panel + Foundation (Week 1-3)** — *Detailed Breakdown*

#### A.1 Task Table

| Task | Files | Verification |
|------|-------|--------------|
| **A1** Supabase project + run migrations | `supabase/migrations/*.sql` | Tables in dashboard |
| **A2** Supabase clients (server + browser) | `lib/db/client.ts`, `lib/db/client-browser.ts` | Types generated |
| **A3** Seed database from `lib/products.ts` | `scripts/seed-database.ts` | 107 products + 20 collections + 5 brands |
| **A4** Admin auth (Supabase Auth, role check) | `lib/auth/admin.ts`, `middleware.ts` | Only admins access `/admin/*` |
| **A5** Admin layout + navigation | `app/(admin)/layout.tsx` | Sidebar: Products, Orders, Customers, Settings, Analytics |
| **A6** Product list table (paginated, searchable, filterable) | `app/(admin)/products/page.tsx` | Server-side paginated list |
| **A7** Product create/edit form (all fields) | `app/(admin)/products/new/page.tsx`, `app/(admin)/products/[id]/edit/page.tsx` | Full CRUD |
| **A8** Rich text editor (TipTap) for description | `components/admin/RichTextEditor.tsx` | Sanitized HTML saved |
| **A9** Structured spec editors (materials, colors, dimensions) | `components/admin/SpecEditors.tsx` | JSONB arrays with validation |
| **A10** Image upload → Cloudflare R2 | `lib/actions/product-images.ts`, `components/admin/ImageUploader.tsx` | Drag-drop, reorder, alt text, primary |
| **A11** Product variants (fabric/finish SKUs) | `app/(admin)/products/[id]/variants/page.tsx` | Separate SKUs per variant |
| **A12** Bulk actions (activate/deactivate, delete, export CSV, update collection) | `app/(admin)/products/page.tsx` toolbar | Checkbox selection + action menu |
| **A13** Site-wide Settings page | `app/(admin)/settings/page.tsx` | All toggles persist to `site_settings` |
| **A14** Pricing Display toggle (`show_pricing`) | `lib/settings/pricing.ts` | OFF = hide prices, show "Contact for Price" |
| **A15** Stock Availability toggle (`show_stock`) | `lib/settings/stock.ts` | OFF = hide badges, lead times |
| **A16** Maintenance Mode toggle | `lib/settings/maintenance.ts`, `middleware.ts` | ON = 503 for non-admins |
| **A17** SEO Defaults + Currency | `lib/settings/seo.ts`, `lib/settings/currency.ts` | Fallbacks in metadata |
| **A18** Discount codes CRUD | `app/(admin)/discounts/page.tsx` | Percentage/fixed, min order, expiry, usage limits |
| **A19** Customer management (list, edit, activate/deactivate) | `app/(admin)/customers/page.tsx` | View tier, credit limit, status |
| **A20** Order Kanban (pending → confirmed → production → shipped → delivered) | `app/(admin)/orders/page.tsx` | Drag-drop status changes |
| **A21** Inventory tracking (available/reserved/incoming, low stock alerts) | `lib/inventory/stock.ts` | Real-time availability badges |
| **A22** Analytics dashboard (view→order funnel, top products, revenue) | `app/(admin)/analytics/page.tsx` | Charts from `order_analytics` |

#### A.2 Key Decisions (Resolve Before Starting)

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| **UI Component Library** | shadcn/ui / Radix + custom / Headless UI | **shadcn/ui** — fastest for admin, Tailwind-native | ✅ Decided |
| **First Admin Creation** | SQL insert / Invite link / Self-serve | **SQL insert** in migration — simplest for MVP (Admin/AdminPassw0rd) | ✅ Decided |
| **Variant Attribute Schema** | Fixed enum / Free-form JSON | **Fixed enum** (fabric, finish, color) — validates better, enables faceted search | ✅ Decided |
| **R2 Credentials** | You provide / I generate example | **You provide** — I'll create `.env.example` | ⏳ Pending |
| **Chart Library** | Recharts / Tremor / Chart.js | **Tremor** — dashboard-native, Tailwind-native | ✅ Decided |
| **Rich Text Allowed Tags** | Minimal / Extended | **Allowed list** (p, strong, em, ul, ol, li, h3, h4) — safer | ✅ Decided |
| **Status Transition Rules** | Free-form / Enforced linear | **Free-form** — no enforcement (per A20) | ✅ Decided |
| **Seed Data Variants** | 1 per product / 1 per color code | **1 per color code** found in scraped data (matches color swatches) | ✅ Decided |
| **Currency** | Multi / Single | **RM (Malaysia Ringgit) only** — per A17 | ✅ Decided |
| **Pricing OFF Behavior** | Show "Contact for Price" / Trigger WhatsApp | **Trigger WhatsApp** — opens WhatsApp browser/app with pre-filled message (per A14) | ✅ Decided |
| **Stock Visibility OFF** | Hide from UI only / Hide from API/search too | **Hide from API/search too** — per A15 | ✅ Decided |
| **Maintenance Mode Allowlist** | IP allowlist / No allowlist | **No allowlist** — per A16 | ✅ Decided |
| **Bulk Actions** | Required / Not required | **Not required** — per A12 | ✅ Decided |
| **Customer Tiers** | Multiple tiers / No tiers | **No tiers** — per A19 | ✅ Decided |
| **Customer Tier in Discount Codes** | Applicable tiers / All customers | **All customers** (empty applicable_tiers) — per A18 | ✅ Decided |

#### A.3 Task Dependencies & Critical Path

```
A1 (Supabase) → A2 (Clients) → A3 (Seed) → A4 (Auth)
                                    ↓
                    A5 (Layout) ← A4 (Middleware)
                                    ↓
        A6 (Product List) ← A2, A3, A5
        A13 (Settings) ← A2, A5
                                    ↓
    A7/A8/A9/A10/A11 (Forms) ← A5, A6
                                    ↓
    A12 (Bulk) ← A6
    A14-A17 (Settings toggles) ← A13
    A18 (Discounts) ← A5, A2
    A19 (Customers) ← A5, A2
    A20 (Orders) ← A5, A2, A21
    A21 (Inventory) ← A2, A3
    A22 (Analytics) ← A2, order_analytics table
```

**Critical Path:** A1 → A2 → A3 → A4 → A5 → A6 → (A7-A11 parallel) → A12

#### A.4 Expanded Acceptance Criteria

- [ ] Admin can create/edit/delete products with all fields (basic info, rich-text description, structured specs, pricing, inventory, SEO)
- [ ] Product variants managed per product (fabric/finish = separate SKU with own price, stock, attributes)
- [ ] Images upload to Cloudflare R2; drag-drop reorder; alt text; primary marker; delete
- [ ] Bulk actions: activate/deactivate, delete, export CSV, change collection (applies to selected rows)
- [ ] Site settings toggles (`show_pricing`, `show_stock`, `maintenance_mode`, SEO defaults, currency) take effect immediately on public pages via `site_settings` table
- [ ] `show_pricing` OFF → hides all prices site-wide, shows "Contact for Price" with mailto link
- [ ] `show_stock` OFF → hides stock badges, lead times, availability from all public pages + API
- [ ] `maintenance_mode` ON → returns 503 for non-admin users with custom message page
- [ ] Discount codes: percentage/fixed, min order, usage limits, expiry, single-use per order
- [ ] Order Kanban: 5 columns, drag-drop with enforced transitions, detail modal on click
- [ ] Inventory: available/reserved/incoming per product/variant; low-stock threshold alerts
- [ ] Analytics dashboard: funnel (view→cart→checkout→order), top products by revenue/views, revenue trend chart
- [ ] No `'use client'` in admin pages except interactive components (drag-drop Kanban, TipTap editor, image upload)

#### A.5 Technical Approach Notes

| Area | Approach |
|------|----------|
| **Data Fetching** | Server Components by default; Server Actions for mutations (create/update/delete) |
| **Auth** | Supabase Auth; `app_metadata.role = 'admin'` checked in middleware; SSR session via `createServerClient` |
| **Forms** | React Hook Form + Zod validation; Server Actions for submit; optimistic UI via `useTransition` |
| **Images** | Upload → R2 via presigned URL (Server Action); store `product_images` record with R2 URL |
| **Rich Text** | TipTap with minimal extensions; sanitize output with DOMPurify before save |
| **Structured Specs** | Dynamic field arrays (add/remove rows); Zod schema for `materials[]` and `colors[]` |
| **Variants** | Separate page per product; inline table for variant list; modal for create/edit |
| **Kanban** | `@dnd-kit/core` for drag-drop; Server Action on drop to update status |
| **Charts** | Tremor components (`<BarChart>`, `<LineChart>`, `<MetricCard>`) fed from Server Component data |
| **Settings** | Single `site_settings` row (id=1); Server Action updates JSONB; `revalidatePath('/')` on change |

#### A.6 Open Questions — **Resolved with Defaults for B2C**

| # | Question | Context | Decision | Status |
|---|----------|---------|----------|--------|
| 1 | **R2 Credentials** — You'll provide `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`? | Required for A10 | **Yes — you will provide** | ✅ Resolved |
| 2 | **Contact for Price** — When `show_pricing=false`, link to `/contact` page or `mailto:sales@...`? | Affects A14 | **Link to `/contact` page** | ✅ Resolved |
| 3 | **Status Transitions** — Allow skip? (e.g., pending → shipped)? Current: enforced linear only. | Affects A20 | **Enforced linear** (pending → paid → shipped → delivered) | ✅ Resolved |
| 4 | **Inventory Reservation** — Auto-reserve on order create? Release on cancel? | Affects A21 | **Auto-reserve on order create; release on cancel/refund** | ✅ Resolved |
| 5 | **Analytics Retention** — How long keep `order_analytics` events? (Default: 1 year) | Affects A22 | **13 months** (GDPR/PDPA compliant) | ✅ Resolved |
| 6 | **Export Formats** — CSV only, or also XLSX/JSON for bulk export? | Affects A12 | **CSV only** (simpler, sufficient for B2C) | ✅ Resolved |

---

**Acceptance Criteria (Summary):**
- Admin can manage entire catalog without code changes
- Site settings toggles immediately affect public site
- Discount codes work at checkout
- Orders flow through Kanban with enforced transitions
- Inventory shows available/reserved/incoming; low-stock alerts fire
- Analytics show funnel metrics + top products + revenue trend

---

### **Phase B: Public Catalog + Cart/Checkout (Week 3-5)** — *Detailed Breakdown*

#### B.1 Task Table

| Task | Files | Verification |
|------|-------|--------------|
| **B1** Server-only data layer (`lib/data/`) | `lib/data/products.ts`, `lib/data/collections.ts` | No client bundle bloat |
| **B2** `/products` Server Component + ISR (revalidate: 3600) | `app/products/page.tsx` | Build passes, no `'use client'` |
| **B3** `/products/[slug]` Server Component + ISR | `app/products/[slug]/page.tsx` | Structured specs, structured data |
| **B4** `/collections` Server Component | `app/collections/page.tsx` | Brand storytelling |
| **B5** `/collections/[slug]` Server Component | `app/collections/[slug]/page.tsx` | Filtered product grid |
| **B6** `generateStaticParams` for dynamic routes | `app/products/[slug]/page.tsx`, `app/collections/[slug]/page.tsx` | Static params at build |
| **B7** Next.js Image `remotePatterns` (R2 + hinlim.com) | `next.config.js` | Optimized images, WebP/AVIF |
| **B8** Cart (Server Action + client state) | `lib/actions/cart.ts`, `components/CartDrawer.tsx` | Persists in session/cookie |
| **B9** Checkout page (shipping, billing, discount code) | `app/checkout/page.tsx` | Creates `orders` record |
| **B10** Discount code validation (Server Action) | `lib/actions/discounts.ts` | Applies percentage/fixed |
| **B11** Order confirmation email (Resend) | `lib/email/order-confirmation.ts` | PDF attachment optional |
| **B12** Customer auth (Supabase: email/password, magic link) | `lib/auth/customer.ts` | Sign up/in/out works |
| **B13** Customer dashboard (orders, saved cart, profile) | `app/(dashboard)/page.tsx` | Protected by middleware |
| **B14** Home page Server Component | `app/page.tsx` | Hero, featured collections/products |

#### B.2 Key Decisions (Resolved)

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| **Cart Persistence** | Cookie / Supabase `cart_items` table / Hybrid | **Hybrid** — anonymous cookie, merge to DB on login | ✅ Decided |
| **Checkout Flow** | Single-page / Multi-step | **Multi-step** — Shipping → Billing → Review | ✅ Decided |
| **Guest Checkout** | Required / Optional / No | **Optional** — allow guest, prompt to create account after | ✅ Decided |
| **Payment** | Stripe now / Invoice later | **Invoice later** — order = invoice request (per Phase A) | ✅ Decided |
| **Shipping Calculation** | Flat rate / Table rate / Carrier API | **Table rate** — weight bands × region; carrier API in Phase D | ✅ Decided |
| **Tax Handling** | Fixed % / By region / Exempt | **Configurable** — admin sets default tax % in `site_settings`; VAT exempt field on customer | ✅ Decided |
| **Order Number Format** | `ORD-YYYY-NNNNNN` / UUID / Custom | `ORD-YYYY-NNNNNN` (sequential per year) | ✅ Decided |
| **Currency** | MYR only / Multi-currency | **MYR only** — per Phase A | ✅ Decided |
| **Email Templates** | Resend + React Email / Plain / MJML | **React Email** — consistent with PDF styling | ✅ Decided |
| **Stock Validation** | Add to cart / Checkout / Reserve on checkout | **Reserve on checkout** — decrement available, increment reserved | ✅ Decided |
| **Min Order Quantity** | Cart / Checkout / Warning | **Enforce at checkout** — prevent submit if any line < MOQ | ✅ Decided |
| **Discount Stacking** | Allow multiple / One per order | **One per order** — per Phase A | ✅ Decided |
| **Cart Merge on Login** | Merge quantities / Replace | **Merge quantities** (sum quantities for same product/variant; cap at available stock) | ✅ Decided |
| **Abandoned Cart** | Track + email / None | **No** (not in MVP scope) | ✅ Decided |
| **Shipping Regions** | Global / Malaysia only | **Peninsular + East Malaysia** only; flat rate per state | ✅ Decided |
| **Tax Display** | Inclusive / Exclusive | **Tax-inclusive** (MYR) | ✅ Decided |
| **Order Confirmation PDF** | Yes / No | **No** (HTML email only) | ✅ Decided |
| **Wishlist Separate from Cart** | Yes / No | **Yes** — separate wishlist (cookie + DB sync) | ✅ Decided |
| **Product Reviews/Q&A Timing** | Phase B / Phase C | **Phase C (active)** | ✅ Decided |
                              ↓
B3, B5 (Dynamic routes) ← B6 (generateStaticParams)
                              ↓
B8 (Cart) ← B1, B2 (product data)
                              ↓
B9 (Checkout) ← B8, B10 (discounts), B12 (auth)
                              ↓
B11 (Email) ← B9
B13 (Dashboard) ← B12 (Auth)
```

**Critical Path:** B1 → B2/B4/B14 → B3/B5 → B6 → B8 → B9 → B11

#### B.4 Expanded Acceptance Criteria

- [ ] All public pages (`/`, `/products`, `/products/[slug]`, `/collections`, `/collections/[slug]`, `/checkout`) are Server Components with ISR (revalidate: 3600)
- [ ] No `'use client'` in page components except `CartDrawer`, checkout form steps, search filters
- [ ] Product detail page includes JSON-LD `Product` structured data (name, price, currency, availability, sku, brand, image, description)
- [ ] Cart persists across sessions (cookie for anonymous, DB for authenticated)
- [ ] Cart drawer shows: product image, name, variant, price, quantity, line total, MOQ warning
- [ ] Checkout: multi-step (Shipping → Billing → Review), validates each step
- [ ] Discount code field at Review step; applies percentage/fixed; shows error if invalid/expired
- [ ] Order creates `orders` + `order_items` records; decrements `stock_available`, increments `stock_reserved`
- [ ] Order confirmation email sent via Resend (React Email template); includes order summary, shipping address, estimated ship date
- [ ] Customer auth: signup (email/password + magic link), login, logout, password reset
- [ ] Customer dashboard: order history (status, totals, items), saved cart, profile edit
- [ ] Home page: hero, featured collections (4), featured products (8), trust badges, CTA
- [ ] Lighthouse Performance > 90 on all pages
- [ ] Images served via Next.js Image Optimization (R2 for new uploads, hinlim.com for legacy)

#### B.5 Technical Approach Notes

| Area | Approach |
|------|----------|
| **Data Layer** | `lib/data/products.ts` — Server-only functions: `getProducts(filters)`, `getProduct(slug)`, `getCollections()`, `getCollection(slug)`; reads from Supabase, respects `site_settings` toggles |
| **Cart** | `lib/actions/cart.ts` — Server Actions: `addToCart`, `updateQuantity`, `removeFromCart`, `getCart`; client state in `CartContext` + cookie sync |
| **Checkout** | `app/checkout/page.tsx` — Server Component wrapper; each step = Client Component with form; Server Action on submit |
| **Discount Validation** | `lib/actions/discounts.ts` — `validateDiscount(code, subtotal)` returns `{valid, discountAmount, error}` |
| **Order Creation** | Server Action in checkout submit: transaction (orders + order_items + inventory update + analytics event) |
| **Auth** | Supabase SSR (`createServerClient` in middleware + Server Components); `lib/auth/customer.ts` helpers |
| **Email** | `lib/email/order-confirmation.tsx` — React Email component; `lib/email/send.ts` — Resend wrapper |
| **Images** | `next.config.js` → `remotePatterns`: R2 (`*.r2.cloudflarestorage.com`) + hinlim.com (`mm.hinlim.com`); sizes: 640, 750, 828, 1080, 1200, 1920 |
| **SEO** | `generateMetadata` in each page; JSON-LD in `<script type="application/ld+json">` |

#### B.6 Open Questions (Stakeholder Input Needed)

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | **Cart merge on login** — Anonymous cart + existing user cart: merge quantities or replace? | Affects B8 | ✅ **Decided** — **Merge quantities** (sum quantities for same product/variant; cap at available stock) |
| 2 | **Abandoned cart** — Track and email reminder? (If yes, schedule: 1hr, 24hr) | Affects B8, B11 | ✅ **Decided** — **No** (not in MVP scope) |
| 3 | **Shipping regions** — Which countries/regions ship to? Flat rate table per region? | Affects B9 shipping calc | ✅ **Decided** — **Peninsular Malaysia + East Malaysia** only; flat rate per state |
| 4 | **Tax display** — Show tax-inclusive or exclusive prices? (B2C typically inclusive) | Affects B9, pricing display | ✅ **Decided** — Tax-inclusive (MYR) |
| 5 | **Order confirmation PDF** — Attach to email? (React-PDF) | Affects B11 | ✅ **Decided** — **No** (HTML email only) |
| 6 | **Wishlist/Save for later** — Separate from cart? | Affects B13 dashboard | ✅ **Decided** — **Yes**, separate wishlist (cookie + DB sync) |
| 7 | **Product reviews/Q&A** — Phase B or Phase C? | Affects B3 | ✅ **Decided** — Phase C (active) |

---

**Acceptance Criteria (Summary):**
- All public pages Server Components + ISR (revalidate: 3600)
- Cart → Checkout → Order flow works end-to-end
- Discount codes (percentage/fixed) apply correctly
- Customer auth + dashboard with order history
- Lighthouse > 90
- Structured data on product pages
- MYR currency only

---

### **Phase C: Discovery & Recommendations (Week 5-6)** — *Core Search + Recommendations Only*

#### C.1 Task Table — **Current Scope (C1, C7 Only)**

| Task | Files | Verification |
|------|-------|--------------|
| **C1** Search & faceted filters (Meilisearch) | `app/api/search/route.ts`, `components/SearchFilters.tsx`, `lib/search/meilisearch.ts` | Search < 100ms; facets: collection, material, finish, price, dimensions, room type |
| **C7** Smart recommendations | `lib/recommendations/engine.ts`, `components/Recommendations.tsx` | "Complete the look", "Customers also bought", recently viewed |

#### C.2 Task Table — **Deferred to Future Phases**

| Task | Status | Target Phase |
|------|--------|--------------|
| **C2** Product compare (max 4) | Deferred | Phase D+ |
| **C3** 360° product viewer + AR | Deferred | Phase D+ |
| **C4** Lookbooks / room sets | Deferred | Phase D+ |
| **C5** Reviews & Q&A | Deferred | Phase D+ |
| **C6** Wishlist + save for later + alerts | Deferred | Phase D+ |
| **C8** Content hub (care guides, styling tips, SEO) | Deferred | Phase D+ |

#### C.2 Key Decisions (C1 + C7 Scope)

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| **Search Engine** | Meilisearch / Algolia / PG FTS | **Meilisearch** — self-hosted, cost-effective, typo-tolerant | ✅ Decided |
| **Search Sync** | DB triggers / Supabase Realtime / App-level | **App-level** — `afterInsert/afterUpdate` in data layer | ✅ Decided |
| **Faceted Filters** | Server-rendered + client refine / Full client | **Server-rendered facets** — initial HTML includes counts | ✅ Decided |
| **Recommendations** | Rule-based / ML / Hybrid | **Rule-based** (same collection, complementary category, price band) | ✅ Decided |
| **Wishlist Persistence** | Cookie only / Cookie + DB sync | **Hybrid** — for future C6 implementation | ✅ Decided |

#### C.3 Task Dependencies & Critical Path

```
B1 (data layer) → C1 (Meilisearch sync)
                          ↓
           C1 (Search API + Filters)
           C7 (Recommendations) ← B1, B9 (purchase history)
```

**Critical Path:** B1 → C1, C7 (parallel)

#### C.4 Expanded Acceptance Criteria (C1 + C7)

**C1 — Search & Faceted Filters:**
- [ ] Meilisearch index: name, description, collection, brand, materials, finishes, dimensions, price, room type, tags; typo-tolerant; < 100ms p95
- [ ] Search API: query, facets (multi-select), price range slider, dimension ranges, sort (relevance, price, newest, rating), pagination
- [ ] Search UI: Server Component renders initial facets with counts; Client Component handles interactions via `router.push`
- [ ] Results page: `/products?search=&collection=&material=&finish=&minPrice=&maxPrice=`

**C7 — Smart Recommendations:**
- [ ] `getComplementary(product)` — same collection, different category (e.g., sofa → coffee table)
- [ ] `getCoPurchased(product)` — frequently bought together (from `order_items`)
- [ ] `getSimilar(product)` — same category, similar price band (±20%)
- [ ] `getRecentlyViewed()` — from cookie/localStorage, max 10
- [ ] Components: `RecommendationsCarousel` (horizontal scroll), `RecentlyViewed` (footer/home)
- [ ] Cached 1hr; invalidates on new order data

#### C.5 Technical Approach Notes (C1 + C7)

| Area | Approach |
|------|----------|
| **Search** | `lib/search/meilisearch.ts` — sync on product upsert in data layer; `app/api/search/route.ts` — GET with facets, pagination; `components/SearchFilters.tsx` — Server Component renders initial facets, Client Component handles interactions |
| **Search Synonyms** | Meilisearch native synonyms via `index.updateSynonyms()` — configured at index creation; includes furniture-specific groups: sofa/couch/settee, tv cabinet/media unit, nightstand/bedside table, malaysian oak/oak, rattan/cane/wicker, living room/lounge, etc. |
| **Recommendations** | `lib/recommendations/engine.ts` — pure functions: `getComplementary()`, `getCoPurchased()`, `getSimilar()`, `getRecentlyViewed()`; cached 1hr; `components/Recommendations.tsx` — `RecommendationsCarousel` + `RecentlyViewed` |
| **Recommendation Placement** | Product page (below fold), cart drawer, home page (hero), post-purchase email | ✅ Decided |

#### C.6 Open Questions (C1 + C7 Only)

| # | Question | Context | Status |
|---|----------|---------|--------|
| 1 | **Search synonyms** — Configure furniture-specific synonyms (sofa↔couch, tv cabinet↔media unit, nightstand↔bedside table, malaysian oak↔oak, rattan↔cane/wicker, living room↔lounge)? | Affects C1 Meilisearch setup | ✅ **Implemented** — configured at index creation |

### **Phase D: Operations, Localization & API (Week 7-10)**

#### D.1 Task Table

| Task | Files | Verification |
|------|-------|--------------|
| **D1** Multi-language (next-intl) | `lib/i18n/`, middleware | EN, ZH, MY |
| **D2** Headless API (REST) | `app/api/v1/` | Products, orders, customers |
| **D3** Analytics & personalization | `lib/analytics/`, `lib/recommendations/` | Conversion funnels, cohort analysis, product recommendations API |

#### D.2 Key Decisions

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| **i18n Strategy** | next-intl / next-translate / Custom | **next-intl** — App Router native, typed, message extraction | ✅ Decided |
| **Languages** | EN only / EN+ZH / EN+ZH+MY | **EN + ZH + MY** — primary markets | ✅ Decided |
| **API Auth** | API Keys / JWT / Both | **API Keys** (server-to-server) + **JWT** (customer) — per Phase B | ✅ Decided |
| **API Rate Limit** | 60/min (customer) / 100/min (API key) | **60/100** — standard; configurable per key | ✅ Decided |

#### D.3 Task Dependencies & Critical Path

```
B1 (Data layer) → D2 (API uses same data functions)
B12 (Auth) → D3 (Analytics needs user context)
```

**Critical Path:** B1 → D2, D3 (parallel) → D1

#### D.4 Expanded Acceptance Criteria

- [ ] Multi-language: EN (default) + ZH + MY; language switcher in header; all public pages translated; admin stays EN
- [ ] Headless API: `GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/collections`, `POST /api/v1/checkout`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`; OpenAPI spec generated
- [ ] Analytics: conversion funnels, cohort analysis, product recommendations API functional

#### D.5 Technical Approach Notes

| Area | Approach |
|------|----------|
| **i18n** | `lib/i18n/request.ts` — `getRequestConfig`; `middleware.ts` — locale detection (header → cookie → default); messages in `messages/en.json`, `messages/zh.json`, `messages/my.json` |
| **API v1** | `app/api/v1/` — Route handlers; `lib/api/validation.ts` — Zod schemas; `lib/api/auth.ts` — verify API key / JWT; rate limiter via `upstash/ratelimit` |
| **Analytics** | `lib/analytics/events.ts` — `trackEvent(event, properties)`; `lib/analytics/funnels.ts` — conversion funnels; `lib/recommendations/engine.ts` — product recommendations API |

#### D.6 Open Questions — **None** (all deferred tasks shelved)

---

## 📋 Future Implementation Queue (Deferred from Phase C & D)
*These tasks are explicitly deferred and will be prioritized in future planning sessions.*

| Task | Description | Files (Estimated) | Dependencies |
|------|-------------|-------------------|--------------|
| **C2** Product compare (max 4) | Side-by-side table, shareable URL, sticky header | `app/products/compare/page.tsx`, `lib/data/compare.ts` | C1, B1 |
| **C3** 360° product viewer + AR | 360° spin (Three.js), WebXR AR "view in room" | `components/viewer/ProductViewer360.tsx`, `components/viewer/ARViewer.tsx` | B3 (360° frames), R2 |
| **C4** Lookbooks / room sets | Curated room sets, shoppable hotspots, "add all to cart" | `app/lookbooks/`, `components/LookbookCard.tsx`, `lib/data/lookbooks.ts` | B1, B3 |
| **C5** Reviews & Q&A (verified purchase) | Star rating, photos, helpful votes, seller replies | `components/reviews/Reviews.tsx`, `lib/actions/reviews.ts`, `app/api/reviews/route.ts` | B9 (orders), B12 (auth) |
| **C6** Wishlist + save for later + alerts | Cookie→DB sync, shareable, price drop/back-in-stock emails | `components/Wishlist.tsx`, `lib/actions/wishlist.ts`, `lib/notifications/alerts.ts` | B12 (auth), B8 (cart) |
| **C8** Content hub (care guides, styling tips, SEO) | MDX-based blog, categories, tags, related products | `app/blog/`, `lib/cms/`, `components/BlogPost.tsx` | Independent (can start anytime) |

---

## 6. Scraper v2 (Parallel Track)

### 6.1 Current Gaps
- No pagination handling (some collections > 50 products)
- No incremental/delta scraping (full re-scrape only)
- No monitoring/alerting on failures
- Detail page scraping is brittle (depends on tab click)
- No schema validation against target DB

### 6.2 Target Architecture

```
scripts/scraper_v2/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── raw.py          # Raw scraped data (Pydantic)
│   │   ├── normalized.py   # DB-ready models (Pydantic)
│   │   └── mapping.py      # Raw → Normalized transformers
│   ├── extractors/
│   │   ├── __init__.py
│   │   ├── collection.py   # Collection page extraction
│   │   ├── product.py      # Product detail extraction
│   │   └── selectors.py    # Centralized selector config
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── runner.py       # Orchestration
│   │   ├── stages.py       # Extract → Transform → Validate → Load
│   │   └── state.py        # Checkpoint/resume support
│   ├── loaders/
│   │   ├── __init__.py
│   │   ├── supabase.py     # Upsert to Supabase
│   │   └── meilisearch.py  # Sync search index
│   └── monitoring/
│       ├── __init__.py
│       ├── metrics.py      # Prometheus metrics
│       └── alerts.py       # Failure notifications
├── tests/
│   ├── test_extractors.py
│   ├── test_transformers.py
│   └── fixtures/
├── config/
│   ├── collections.yaml    # Collection URLs + metadata
│   └── selectors.yaml      # CSS/XPath selectors per brand
├── pyproject.toml
└── README.md
```

### 6.3 Key Improvements

| Feature | Implementation |
|---------|----------------|
| **Incremental scraping** | Track `last_scraped_at` per product; only re-scrape changed |
| **Pagination** | Detect "Load More"/pagination; follow all pages |
| **Resilience** | Retry with exponential backoff; checkpoint every N products |
| **Validation** | Pydantic models match DB schema; fail fast on drift |
| **Monitoring** | Structured JSON logs; Prometheus metrics; alert on >5% failure |
| **Type generation** | `pydantic2ts` → `types/database.ts` (single source of truth) |

---

## 7. API Design (Future Headless)

### 7.1 REST Endpoints

```
GET    /api/v1/brands                    # List brands
GET    /api/v1/brands/:id                # Brand detail
GET    /api/v1/collections               # List collections (filter: brand, active)
GET    /api/v1/collections/:id           # Collection detail + products
GET    /api/v1/products                  # Search/filter products
GET    /api/v1/products/:id              # Product detail
GET    /api/v1/products/:id/spec-sheet   # PDF spec sheet
POST   /api/v1/cart                      # Add to cart (session)
POST   /api/v1/checkout                  # Create order (auth required)
GET    /api/v1/orders                    # List customer orders (auth)
GET    /api/v1/orders/:id                # Order detail + tracking (auth)
```

### 7.2 Authentication
- **API Keys** for server-to-server (partners, ERP)
- **JWT** (Supabase) for customer sessions
- **Rate limiting:** 100 req/min (API keys), 60 req/min (customer)

---

## 8. Deployment & Operations

### 8.1 Environments

| Environment | Purpose | Deploy Trigger | Data |
|-------------|---------|----------------|------|
| `development` | Local dev | `npm run dev` | Local Supabase / seeded |
| `preview` | PR previews | Push to any branch | Staging Supabase (subset) |
| `staging` | QA/Stakeholder | Merge to `main` | Staging Supabase (full) |
| `production` | Live | Tag `v*` / manual | Production Supabase |

### 8.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - install-deps
      - run: npm run lint && npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - install-deps
      - run: npm run test:unit && npm run test:e2e

  build:
    needs: [lint-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - install-deps
      - run: npm run build
      - upload-artifact: .next/standalone

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - deploy-to-vercel-preview

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - deploy-to-vercel-staging
      - run-smoke-tests

  deploy-production:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production
    steps:
      - deploy-to-vercel-production
      - run-smoke-tests
      - notify-slack
```

### 8.3 Monitoring & Observability

| Tool | Purpose |
|------|---------|
| **Vercel Analytics** | Core Web Vitals, page views |
| **Sentry** | Error tracking (frontend + API) |
| **Supabase Logs** | Database queries, auth events |
| **Meilisearch Dashboard** | Search performance |
| **Custom Cron** | Scraper health, data freshness |

---

## 9. Open Questions & Decisions Made

| # | Decision | Options | Chosen | Notes |
|---|----------|---------|--------|-------|
| 1 | **Build order** | Public first / **Admin first** | **Admin first** | Admin controls site-wide settings |
| 2 | **Pricing model** | Tiered per customer / **Fixed per product** | **Fixed per product** | Single `price_usd` on product |
| 3 | **Quote flow** | Quote cart + PDF / **Cart + checkout with discount codes** | **Cart + checkout** | No quotes; discount codes at checkout |
| 4 | **Variants** | Single product with options / **Separate SKU per fabric/finish** | **Separate SKU** | `product_variants` table |
| 5 | **Roles** | Admin, Sales, Warehouse, Customer / **Admin, Customer only** | **Admin, Customer** | Simpler RBAC |
| 6 | **Inventory** | Multi-warehouse / **Single pool** | **Single pool** | `stock_available/reserved/incoming` |
| 7 | **Quote approval** | Required / **Not needed (no quotes)** | **N/A** | Removed quotes entirely |
| 8 | **Analytics** | Full funnel / **View→Order, Top Products** | **View→Order, Top Products** | `order_analytics` table |
| 9 | **Image hosting** | Keep hinlim.com / **Cloudflare R2** | **Cloudflare R2** | Cost, control, Next.js optimization |
| 10 | **Scraper schedule** | Daily / **Weekly + webhook** | **Weekly + webhook** | Incremental + on-demand |

---

## 10. Appendix: Current File Map

```
/opt/data/workspace/projects/b2b-furniture-ecommerce/
├── app/
│   ├── layout.tsx                    # Root layout (client)
│   ├── page.tsx                      # Home (client)
│   ├── globals.css                   # Tailwind + custom
│   ├── products/
│   │   ├── page.tsx                  # Catalog (client) ← Phase B
│   │   └── [slug]/
│   │       └── page.tsx              # Product detail (client) ← Phase B
│   ├── collections/
│   │   ├── page.tsx                  # Collections index (client) ← Phase B
│   │   └── [slug]/
│   │       └── page.tsx              # Collection detail (client) ← Phase B
│   └── api/                          # ← Phase B+
├── components/                       # Empty ← Will add shared UI
├── lib/
│   ├── products.ts                   # 260KB static data ← Phase B replace
│   └── utils.ts                      # ← Add helpers
├── data/
│   ├── raw/                          # Scraper output
│   └── clean/                        # Cleaned JSON
├── scripts/
│   ├── scrape_products.py            # Playwright scraper
│   ├── clean_products.py             # Pydantic → TypeScript
│   ├── requirements.txt
│   └── .venv/
├── scraper/
│   └── src/scraper/                  # Empty (legacy structure)
├── public/
├── next.config.js                    # Standalone output
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── Dockerfile
└── nixpacks.toml
```

---

## 11. Next Actions

1. **Confirm Phase A scope** (admin panel tasks A1-A22)
2. **Set up Supabase project** + run initial migration
3. **Generate migration SQL** from schema in §4.2
4. **Create detailed Phase A task plan** (using `plan` skill)
5. **Begin Phase A1-A4** (Supabase, auth, admin layout)

---

*Document version: 0.2 | Updated per stakeholder decisions on 2026-07-14*