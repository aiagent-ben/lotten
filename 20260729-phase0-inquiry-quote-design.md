# Phase 0 Design Sprint: Inquiry → Quote → Order System

**Project:** Lotten — Malaysian Oak Furniture D2C/B2B E-commerce  
**Date:** 2026-07-29  
**Status:** Draft for Review  
**Supersedes:** SPEC.md Phase B (Cart/Checkout) — Full Replacement

---

## Executive Summary

**Problem:** Cart removed. No replacement. High-AOV configurable oak furniture requires multi-item quote building, stock reservation, B2B negotiation, and versioned quotes.

**Solution:** Design a complete **Inquiry → Quote → Order** system with:
- Multi-item **Inquiry Builder** (replaces cart)
- **Quote Engine** with versioning, stock reservation, pricing rules
- **Order Conversion** from accepted quotes
- Admin workflow for sales reps
- Customer portal for quote management

**Timeline:** 2-3 weeks design + spec, then implementation in tracks.

---

## 1. State Machine — Core Invariant

```
┌─────────────┐     submit      ┌─────────────┐     generate      ┌─────────────┐
│  INQUIRY    │ ──────────────▶ │    QUOTE    │ ────────────────▶ │    ORDER    │
│  (Draft)    │                 │  (v1, v2...) │                   │  (Confirmed)│
└─────────────┘                 └─────────────┘                   └─────────────┘
      │                              │    │    │                          │
      │ add_item                     │    │    │ accept                   │
      │ update_config                │    │    └──── revise ──────────────┘
      │ save_draft                   │    │         │
      ▼                              ▼    ▼         ▼
┌─────────────┐               ┌─────────────┐ ┌─────────────┐
│  ABANDONED  │               │   EXPIRED   │ │  PRODUCTION │
│  (30d idle) │               │ (30d no act)│ │  → SHIPPED  │
└─────────────┘               └─────────────┘ └─────────────┘
```

### State Definitions

| Entity | States | Transitions | Invariants |
|--------|--------|-------------|------------|
| **Inquiry** | `draft` → `submitted` → `qualified` → `quoted` | `add_item`, `update_config`, `submit`, `assign_rep` | 1+ items, config per item, customer contact captured |
| **Quote** | `v1_draft` → `v1_sent` → `v2_draft` → `v2_sent` → `accepted` / `rejected` / `expired` | `generate`, `send`, `revise`, `accept`, `reject`, `auto_expire` | Versioned, stock reserved, pricing locked, PDF generated |
| **Order** | `confirmed` → `production` → `shipped` → `delivered` | `convert_from_quote`, `start_production`, `ship`, `deliver` | Immutable from quote, payment terms apply |
| **StockReservation** | `active` → `released` / `converted` / `expired` | `reserve`, `release`, `convert`, `cron_expire` | Tied to quote version, 48h TTL, auto-release on expiry |

---

## 2. Database Schema — New Tables

### 2.1 Core Tables

```sql
-- Inquiries: Customer intent capture (replaces cart)
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,  -- NULL = anonymous
  session_id TEXT NOT NULL,  -- for anonymous tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','qualified','quoted','abandoned')),
  source_channel TEXT DEFAULT 'web',  -- 'web', 'showroom', 'phone', 'email'
  assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,  -- customer notes
  internal_notes TEXT,  -- sales rep notes
  submitted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- inquiry auto-abandon after 30 days
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inquiry Items: Product + Configuration (replaces cart_items)
CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Configuration captured at inquiry time (finish, dimensions, hardware, upholstery)
  configuration JSONB NOT NULL DEFAULT '{}',  -- validated per product schema
  -- Pricing (nullable until quoted)
  unit_price_usd DECIMAL(10,2),  -- quoted price
  line_total_usd DECIMAL(12,2),  -- unit_price * quantity
  notes TEXT,  -- customer special requests
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quotes: Versioned, priced, reservable (core B2B artifact)
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE RESTRICT,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','negotiating','accepted','rejected','expired')),
  quote_number TEXT NOT NULL UNIQUE,  -- 'Q-2026-00123-v1'
  valid_until TIMESTAMPTZ NOT NULL,  -- 30 days from send
  -- Pricing
  subtotal_usd DECIMAL(12,2) NOT NULL,
  discount_usd DECIMAL(12,2) DEFAULT 0,
  tax_usd DECIMAL(12,2) DEFAULT 0,
  shipping_usd DECIMAL(12,2) DEFAULT 0,
  total_usd DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  -- Terms
  payment_terms_days INT DEFAULT 30,
  deposit_percent INT DEFAULT 50,  -- % due on acceptance
  lead_time_weeks INT,
  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  -- Audit
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_by UUID REFERENCES auth.users(id),  -- sales rep
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (inquiry_id, version)
);

-- Quote Items: Snapshotted from inquiry_items at quote generation
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  inquiry_item_id UUID REFERENCES inquiry_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  configuration JSONB NOT NULL,  -- frozen snapshot
  unit_price_usd DECIMAL(10,2) NOT NULL,
  line_total_usd DECIMAL(12,2) NOT NULL,
  -- Stock reservation reference
  reservation_id UUID REFERENCES stock_reservations(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quote Versions: Negotiation audit trail
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  -- Full snapshot for diff/comparison
  snapshot JSONB NOT NULL,  -- { items: [...], pricing: {...}, terms: {...} }
  change_summary TEXT,  -- "v2: Reduced finish upcharge 15% → 10%, extended lead time 2w"
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id, version)
);

-- Stock Reservations: Time-bound holds for quoted items
CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','converted','expired')),
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,  -- quote.valid_until + buffer
  converted_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  released_reason TEXT,  -- 'quote_expired', 'quote_rejected', 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders: Actual orders (from quote conversion or direct)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,  -- NULL = direct order
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,  -- 'ORD-2026-00123'
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','production','shipped','delivered','cancelled','on_hold')),
  -- Pricing (copied from quote at conversion)
  subtotal_usd DECIMAL(12,2) NOT NULL,
  discount_usd DECIMAL(12,2) DEFAULT 0,
  tax_usd DECIMAL(12,2) DEFAULT 0,
  shipping_usd DECIMAL(12,2) DEFAULT 0,
  total_usd DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  payment_terms_days INT DEFAULT 30,
  deposit_percent INT DEFAULT 50,
  deposit_paid_usd DECIMAL(12,2) DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,
  -- Fulfillment
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  delivered_date DATE,
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  -- Audit
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  production_started_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items: Snapshot from quote_items at conversion
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  configuration JSONB NOT NULL,
  unit_price_usd DECIMAL(10,2) NOT NULL,
  line_total_usd DECIMAL(12,2) NOT NULL,
  -- Production tracking
  production_status TEXT DEFAULT 'pending' CHECK (production_status IN ('pending','in_production','completed','shipped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Negotiation Thread: B2B quote discussion
CREATE TABLE negotiation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id),  -- customer or rep
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,  -- internal rep notes vs customer-visible
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Indexes & Constraints

```sql
-- Performance
CREATE INDEX idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX idx_inquiries_session_id ON inquiries(session_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_assigned_rep ON inquiries(assigned_rep_id);
CREATE INDEX idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);
CREATE INDEX idx_quotes_inquiry_id ON quotes(inquiry_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_stock_reservations_quote_id ON stock_reservations(quote_id);
CREATE INDEX idx_stock_reservations_expires ON stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_quote_id ON orders(quote_id);
CREATE INDEX idx_negotiation_threads_quote_id ON negotiation_threads(quote_id);

-- Trigger: updated_at
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (critical for B2B data isolation)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_threads ENABLE ROW LEVEL SECURITY;

-- Customers see own inquiries/quotes/orders
CREATE POLICY "Customer own inquiries" ON inquiries FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Customer own orders" ON orders FOR ALL USING (customer_id = auth.uid());

-- Sales reps see assigned inquiries/quotes
CREATE POLICY "Rep assigned inquiries" ON inquiries FOR ALL USING (assigned_rep_id = auth.uid() OR auth.jwt()->>'role' = 'admin');
CREATE POLICY "Rep quotes" ON quotes FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid())
  OR auth.jwt()->>'role' = 'admin'
);

-- Admins see all
CREATE POLICY "Admin all" ON inquiries FOR ALL USING (auth.jwt()->>'role' = 'admin');
-- ... repeat for other tables
```

### 2.3 Configuration Schema (per Product)

Each product defines valid configuration options. Stored in `products.configuration_schema` (new column):

```json
{
  "type": "object",
  "properties": {
    "finish": { "type": "string", "enum": ["Natural", "Cocoa", "Walnut", "White Wash", "Grey Wash"] },
    "dimensions": {
      "type": "object",
      "properties": {
        "width_mm": { "type": "integer", "minimum": 800, "maximum": 3000, "step": 100 },
        "depth_mm": { "type": "integer", "minimum": 400, "maximum": 1200, "step": 50 },
        "height_mm": { "type": "integer", "minimum": 400, "maximum": 2400, "step": 50 }
      },
      "required": ["width_mm", "depth_mm", "height_mm"]
    },
    "hardware": { "type": "string", "enum": ["Black Matte", "Brushed Brass", "Antique Bronze", "Stainless Steel"] },
    "upholstery": { "type": "string", "enum": ["None", "Linen Natural", "Linen Grey", "Velvet Emerald", "Leather Tan"] }
  },
  "required": ["finish", "dimensions", "hardware"]
}
```

Validated on inquiry_item create/update and quote generation.

---

## 3. API Endpoints

### 3.1 Inquiry API

```
POST   /api/v1/inquiries                    # Create inquiry (anonymous or auth)
GET    /api/v1/inquiries/:id                # Get inquiry with items
PATCH  /api/v1/inquiries/:id                # Update inquiry (notes, status)
POST   /api/v1/inquiries/:id/items          # Add item to inquiry
PATCH  /api/v1/inquiries/:id/items/:itemId  # Update item config/qty
DELETE /api/v1/inquiries/:id/items/:itemId  # Remove item
POST   /api/v1/inquiries/:id/submit         # Submit for qualification (draft → submitted)
POST   /api/v1/inquiries/:id/assign-rep     # Assign sales rep (admin)
```

### 3.2 Quote API

```
POST   /api/v1/quotes                       # Generate quote from inquiry (v1)
GET    /api/v1/quotes/:id                   # Get quote with items
POST   /api/v1/quotes/:id/send              # Send quote to customer (draft → sent)
POST   /api/v1/quotes/:id/revise            # Create new version (v1 → v2_draft)
PATCH  /api/v1/quotes/:id                   # Update quote pricing/terms (draft only)
POST   /api/v1/quotes/:id/accept            # Customer accepts quote
POST   /api/v1/quotes/:id/reject            # Customer rejects quote
GET    /api/v1/quotes/:id/pdf               # Download quote PDF
GET    /api/v1/quotes/:id/history           # Version history
POST   /api/v1/quotes/:id/convert           # Convert accepted quote → order (admin)
```

### 3.3 Customer Portal API

```
GET    /api/v1/customer/inquiries           # List my inquiries
GET    /api/v1/customer/quotes              # List my quotes (with status)
GET    /api/v1/customer/quotes/:id          # Quote detail (accept/reject actions)
GET    /api/v1/customer/orders              # List my orders
```

### 3.4 Admin API

```
GET    /api/v1/admin/inquiries              # List with filters (status, rep, date)
GET    /api/v1/admin/inquiries/:id          # Inquiry detail + actions
PATCH  /api/v1/admin/inquiries/:id          # Assign rep, add internal notes
GET    /api/v1/admin/quotes                 # List quotes
GET    /api/v1/admin/quotes/:id             # Quote detail + version history
POST   /api/v1/admin/quotes/:id/generate    # Generate quote from inquiry
POST   /api/v1/admin/quotes/:id/send        # Send to customer
POST   /api/v1/admin/quotes/:id/revise      # Create revision
POST   /api/v1/admin/quotes/:id/convert     # Convert to order
GET    /api/v1/admin/orders                 # Orders (existing, enhanced)
```

### 3.5 Webhooks

```
POST   /api/webhooks/quote-accepted         # Trigger: order creation, stock conversion, deposit invoice
POST   /api/webhooks/quote-expired          # Trigger: release stock reservations
POST   /api/webhooks/inquiry-abandoned      # Trigger: nurture email
```

---

## 4. Frontend Components

### 4.1 Inquiry Builder (Replaces Cart Drawer)

```
┌─────────────────────────────────────────────────────────┐
│  My Quote Builder                    [×]                │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  BREDA 1.5M TV Cabinet                            │  │
│  │  Finish: [Cocoa ▼]  Dimensions: [1500×450×600]   │  │
│  │  Hardware: [Brushed Brass ▼]  Qty: [1] [−] [+]    │  │
│  │  Upholstery: [None ▼]                             │  │
│  │  ──────────────────────────────────────────────   │  │
│  │  Estimated: MYR 2,890        [Remove]             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  DOVER 2-Seater Sofa                              │  │
│  │  Finish: [Natural ▼]  Fabric: [Linen Grey ▼]      │  │
│  │  Dimensions: [2000×900×850]  Qty: [1]             │  │
│  │  ──────────────────────────────────────────────   │  │
│  │  Estimated: MYR 4,200        [Remove]             │  │
│  └───────────────────────────────────────────────────┘  │
│  ─────────────────────────────────────────────────────  │
│  Subtotal: MYR 7,090                                    │
│  Est. Lead Time: 8-10 weeks                             │
│  ─────────────────────────────────────────────────────  │
│  [Save Draft]                    [Request Quote →]      │
└─────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Opens from "Add to Quote" button on product page (not "Inquire" — implies multi-item)
- Persists to `inquiries` table via session_id (anonymous) or customer_id (auth)
- Real-time price estimation using product base price + config modifiers
- Configuration UI generated from `product.configuration_schema`
- "Save Draft" → `inquiries.status = 'draft'`
- "Request Quote" → `inquiries.status = 'submitted'`, triggers rep assignment

### 4.2 Product Page — "Add to Quote" Button

```tsx
// ProductDetailClient.tsx
<Button 
  className="w-full lg:w-auto"
  onClick={() => openInquiryBuilder(product.id)}
  disabled={!product.is_active || product.stock_available === 0}
>
  {product.stock_available > 0 ? 'Add to Quote' : 'Out of Stock'}
</Button>
```

### 4.3 Quote View (Customer Portal)

```
/quotes/q-2026-00123-v2
├── Header: Quote #, Version, Status Badge, Valid Until
├── Items Table: Product, Config, Qty, Unit Price, Line Total
├── Pricing: Subtotal, Discount, Tax, Shipping, Total
├── Terms: Payment, Lead Time, Deposit
├── Actions: [Accept Quote] [Reject] [Download PDF] [Request Revision]
└── Thread: Negotiation messages (customer ↔ rep)
```

### 4.4 Admin: Inquiry Management

```
/admin/inquiries
├── Kanban: Draft → Submitted → Qualified → Quoted → Abandoned
├── Filters: Rep, Channel, Date, Product, Value Range
├── Row: Inquiry #, Customer, Items Count, Est. Value, Status, Rep, Age
└── Actions: Assign Rep, View, Generate Quote, Add Note

/admin/inquiries/:id
├── Customer Info, Channel, Notes
├── Items: Configurable, editable (rep can adjust config)
├── Actions: [Generate Quote] [Mark Qualified] [Add Internal Note]
└── History: Status changes, rep assignments
```

### 4.5 Admin: Quote Management

```
/admin/quotes
├── Kanban: Draft → Sent → Viewed → Negotiating → Accepted/Rejected/Expired
├── Filters: Rep, Status, Date, Value, Version
├── Row: Quote #, Customer, Version, Total, Status, Valid Until, Rep

/admin/quotes/:id
├── Version Selector: v1, v2, v3... (with diff view)
├── Pricing Editor (draft only): Line items, discounts, shipping, tax
├── Terms Editor: Payment terms, deposit %, lead time, valid until
├── PDF Preview / Regenerate
├── Actions: [Send] [Revise] [Convert to Order] [Add Internal Note]
└── Negotiation Thread: Customer messages, rep replies
```

---

## 5. Business Logic — Pricing Engine

### 5.1 Price Calculation (Quote Generation)

```typescript
interface PriceCalculationInput {
  items: {
    product: Product;
    variant?: ProductVariant;
    quantity: number;
    configuration: Configuration;  // validated against product.schema
  }[];
  customerTier: 'retail' | 'trade' | 'project' | 'vip';
  shippingAddress: Address;
  discountCode?: string;
}

interface PriceCalculationOutput {
  lineItems: {
    productId: string;
    variantId?: string;
    quantity: number;
    basePrice: number;           // from product/variant
    configModifiers: {           // finish, dimension, hardware, upholstery
      finish: number;
      dimensions: number;
      hardware: number;
      upholstery: number;
    };
    unitPrice: number;           // base + modifiers
    lineTotal: number;
  }[];
  subtotal: number;
  discount: { code: string; amount: number; type: 'percent' | 'fixed' } | null;
  tax: number;                   // from site_settings.tax_rate
  shipping: number;              // from shipping calculator
  total: number;
  leadTimeWeeks: number;         // max of all items + buffer
  stockAvailable: boolean;       // all items have stock
}
```

### 5.2 Configuration Modifiers

| Config Type | Modifier Logic |
|-------------|----------------|
| **Finish** | Base price × finish_multiplier (Cocoa 1.0, Walnut 1.08, White Wash 1.12, Grey Wash 1.15) |
| **Dimensions** | Base price × (custom_volume / standard_volume) ^ 0.7 (economies of scale) |
| **Hardware** | Fixed add: Black Matte 0, Brushed Brass +MYR 80, Antique Bronze +MYR 120, Stainless +MYR 150 |
| **Upholstery** | Fabric +MYR 300/seat, Velvet +MYR 500/seat, Leather +MYR 1200/seat |

### 5.3 Tiered Pricing

```sql
-- customer_tiers table (new)
CREATE TABLE customer_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,  -- 'retail', 'trade', 'project', 'vip'
  discount_percent DECIMAL(5,2) DEFAULT 0,  -- 5.00 = 5%
  min_order_value_usd DECIMAL(12,2) DEFAULT 0,
  payment_terms_days INT DEFAULT 30,
  requires_approval BOOLEAN DEFAULT false
);
```

Applied at quote generation: `unit_price × (1 - tier.discount_percent/100)`

### 5.4 Stock Reservation Logic

```typescript
async function reserveStockForQuote(quoteId: string): Promise<StockReservation[]> {
  const quote = await getQuoteWithItems(quoteId);
  const reservations: StockReservation[] = [];
  
  for (const item of quote.items) {
    const available = await getAvailableStock(item.productId, item.variantId);
    if (available < item.quantity) {
      throw new Error(`Insufficient stock for ${item.productName}: ${available} available, ${item.quantity} requested`);
    }
    
    const reservation = await createStockReservation({
      quoteId,
      quoteItemId: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      expiresAt: quote.validUntil,  // 30 days
    });
    
    // Decrement available, increment reserved
    await adjustStock(item.productId, item.variantId, {
      available: -item.quantity,
      reserved: +item.quantity,
    });
    
    reservations.push(reservation);
  }
  
  return reservations;
}

// Cron job: release expired reservations
// Runs every hour
async function releaseExpiredReservations() {
  const expired = await supabase
    .from('stock_reservations')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());
  
  for (const res of expired.data || []) {
    await releaseReservation(res.id, 'quote_expired');
  }
}
```

---

## 6. Email Templates (5 New)

| Template | Trigger | Key Variables |
|----------|---------|---------------|
| `inquiry-confirmation` | Inquiry submitted | inquiry_number, items[], estimated_total, rep_contact, next_steps |
| `quote-sent` | Quote sent to customer | quote_number, version, valid_until, total, pdf_url, accept_url, reject_url |
| `quote-accepted` | Customer accepts quote | quote_number, order_number (if auto-converted), deposit_amount, deposit_due_date, payment_link |
| `quote-rejected` | Customer rejects quote | quote_number, rejection_reason, rep_contact, alternative_options |
| `invoice-payment-request` | Order confirmed, deposit due | order_number, deposit_amount, due_date, payment_link, balance_due_date |

All templates: React Email components, responsive, branded (Cormorant Garamond/Inter, Amber #78350F).

---

## 7. Analytics Event Taxonomy (New)

```typescript
// Replace cart/checkout events with inquiry/quote funnel
type InquiryEventType = 
  | 'inquiry_started'        // Inquiry Builder opened
  | 'inquiry_item_added'     // Item added to builder
  | 'inquiry_item_configured' // Config changed
  | 'inquiry_item_removed'   // Item removed
  | 'inquiry_saved_draft'    // Save Draft clicked
  | 'inquiry_submitted'      // Request Quote clicked
  | 'inquiry_qualified'      // Rep marks qualified
  | 'quote_generated'        // v1 created
  | 'quote_sent'             // Sent to customer
  | 'quote_viewed'           // Customer opens quote
  | 'quote_revised'          // v2+ created
  | 'quote_accepted'         // Customer accepts
  | 'quote_rejected'         // Customer rejects
  | 'quote_expired'          // Auto-expired
  | 'order_converted'        // Quote → Order
  | 'deposit_paid'           // Deposit received
  | 'order_completed';       // Delivered

// Funnel: inquiry_started → inquiry_submitted → quote_sent → quote_viewed → quote_accepted → order_converted → deposit_paid → order_completed
```

---

## 8. Migration Strategy — Safe Transition

### 8.1 Phase 0: Design Review (This Document)
- Review with stakeholders
- Finalize schema, API, UI
- Update SPEC.md Phase B

### 8.2 Phase 1: Database (Week 1)
1. **Create new tables** (inquiries, inquiry_items, quotes, quote_items, quote_versions, stock_reservations, orders, order_items, negotiation_threads, customer_tiers)
2. **Add columns** to existing: `products.configuration_schema`, `customers.tier_id`
3. **Soft-deprecate** cart tables: `ALTER TABLE carts RENAME TO carts_deprecated_20260729` (if exist)
4. **Migrate analytics**: Create `inquiry_analytics` table, backfill from `order_analytics` where possible
5. **RLS policies** on all new tables
6. **Indexes** for query patterns

### 8.3 Phase 2: Backend (Week 1-2)
1. Server Actions: `inquiry.ts`, `quote.ts`, `stock.ts`
2. API Routes: `/api/v1/inquiries`, `/api/v1/quotes`, `/api/v1/customer/*`, `/api/v1/admin/*`
3. Email service integration (5 templates)
4. PDF generation (React-PDF or puppeteer)
5. Cron: `release-expired-reservations`, `auto-expire-quotes`, `abandoned-inquiry-nurture`

### 8.4 Phase 3: Frontend (Week 2-3)
1. Inquiry Builder component (modal/drawer)
2. "Add to Quote" button on product pages
3. Customer Portal: `/inquiries`, `/quotes/:id`, `/orders`
4. Admin: `/admin/inquiries`, `/admin/quotes` (new pages)
5. Configuration UI generator from JSON Schema
6. Real-time price estimation

### 8.5 Phase 4: Cleanup (Week 3)
1. Remove "Add to Cart" strings, ShoppingCart icons
2. Remove cart analytics enums, funnel code
3. Drop deprecated tables (after 90-day grace)
4. Remove dead dependencies (Stripe, cart zod schemas, toast libs)
5. Update SPEC.md with implemented Phase B

---

## 9. SPEC.md Phase B Replacement

### 9.1 New Phase B Task Table

| Task | Files | Verification |
|------|-------|--------------|
| **B1** Server-only data layer (products, collections) | `lib/data/` | Build passes, no client bundle bloat |
| **B2** `/products` Server Component + ISR | `app/products/page.tsx` | SEO, filters, pagination |
| **B3** `/products/[slug]` Server Component + ISR | `app/products/[slug]/page.tsx` | Structured specs, JSON-LD, "Add to Quote" |
| **B4** `/collections` Server Component | `app/collections/page.tsx` | Brand storytelling |
| **B5** `/collections/[slug]` Server Component | `app/collections/[slug]/page.tsx` | Filtered product grid |
| **B6** `generateStaticParams` for dynamic routes | `app/products/[slug]/page.tsx`, `app/collections/[slug]/page.tsx` | Static params at build |
| **B7** Next.js Image remotePatterns (R2 + hinlim.com) | `next.config.js` | Optimized images, WebP/AVIF |
| **B8** **Inquiry Builder** (multi-item, config capture) | `components/InquiryBuilder.tsx`, `lib/actions/inquiry.ts` | Persists to DB, real-time pricing |
| **B9** **Quote Engine** (generation, versioning, PDF) | `lib/actions/quote.ts`, `app/api/v1/quotes/` | Versioned, stock reserved, PDF valid |
| **B10** **Stock Reservation** (48h TTL, cron release) | `lib/actions/stock.ts`, `supabase/functions/release-reservations` | No oversell, auto-release |
| **B11** **Customer Portal** (inquiries, quotes, orders) | `app/[locale]/inquiries/`, `app/[locale]/quotes/[id]/` | Accept/reject, download PDF, thread |
| **B12** **Admin Inquiry Management** | `app/admin/(admin)/inquiries/` | Kanban, assign rep, generate quote |
| **B13** **Admin Quote Management** | `app/admin/(admin)/quotes/` | Version diff, revise, send, convert |
| **B14** **Email Templates** (5 new) | `lib/emails/` | React Email, Resend, branded |
| **B15** **Analytics Funnel** (inquiry → quote → order) | `lib/analytics/engine.ts` | New event taxonomy, dashboards |

### 9.2 New Key Decisions (Replace B.2)

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| **Inquiry Persistence** | Cookie only / DB only / Hybrid | **Hybrid** — anonymous session_id → merge to customer on login | ⬜ |
| **Quote Validity** | 14d / 30d / 60d / Custom | **30 days** — industry standard for furniture | ⬜ |
| **Stock Reservation TTL** | Quote validity / Fixed 48h / Fixed 7d | **Quote validity** — reservation expires with quote | ⬜ |
| **Deposit %** | 0% / 30% / 50% / 100% | **50%** — standard for custom furniture | ⬜ |
| **Tiered Pricing** | None / Customer tier / Volume / Both | **Customer tier + volume** — trade/project discounts | ⬜ |
| **Quote Revision Limit** | Unlimited / 3 / 5 | **3 revisions** — prevents endless negotiation | ⬜ |
| **Auto-Convert on Accept** | Yes / No (admin review) | **Yes** — creates order, triggers deposit invoice | ⬜ |
| **B2B Payment Terms** | Net-30 / Net-60 / Custom | **Net-30 default, configurable per tier** | ⬜ |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Scope creep** — Quote engine becomes ERP | High | High | Time-box Phase 0; defer: inventory allocation, MRP, supplier POs |
| **Stock reservation race conditions** | Medium | High | Use DB transactions + `SELECT FOR UPDATE` on stock adjustment |
| **PDF generation performance** | Medium | Medium | Async generation, cache PDF URL, regenerate on quote change |
| **Configuration schema drift** | Medium | Medium | Version schemas in `products.configuration_schema_version`, validate on read |
| **B2B negotiation complexity** | Low | High | Start simple: versioned quotes + thread; defer approval workflows |
| **Migration data loss** | Low | Critical | Backup before migration, test on Supabase branch, PITR enabled |
| **Customer confusion: "Quote" vs "Order"** | Medium | Medium | Clear UX copy: "Request Quote" → "Review Quote" → "Confirm Order" |

---

## 11. Sign-Off Required

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | | ⬜ | |
| Engineering Lead | | ⬜ | |
| Sales/Operations | | ⬜ | |
| Finance (deposit/terms) | | ⬜ |

---

# SYSTEMS ARCHITECT REVIEW

*Review Date: 2026-07-29 | Reviewer: Senior Systems Architect | Status: **CONDITIONAL APPROVAL — Address Critical Items Before Implementation***

---

## 1. Correctness — State Machine Analysis

### Missing States & Transitions

| Issue | Severity | Detail |
|-------|----------|--------|
| **Inquiry: `qualified` state has no explicit transition to `quoted`** | 🔴 Critical | Table shows `qualified` → `quoted` but no `generate_quote` action listed. Add `generate_quote` to Inquiry transitions or clarify Quote generation is separate entity action. |
| **Quote: `viewed` state is terminal in diagram but transitional in table** | 🟡 Medium | State diagram shows `sent` → `viewed` → `negotiating` but table lists `viewed` as standalone status. Add `view` transition from `sent` to `viewed`. |
| **Quote: `negotiating` state missing from diagram** | 🟡 Medium | Table has `negotiating` status but diagram jumps `sent` → `accepted`/`rejected`/`expired`. Add `negotiating` node with `revise` loop. |
| **StockReservation: no `converted` → `released` path** | 🟡 Medium | If order cancelled after conversion, reservation should release stock back. Add `order_cancelled` → `release` transition. |
| **Order: `on_hold` state has no entry/exit transitions** | 🟡 Medium | Define what triggers hold (payment issue, production delay) and resume/cancel paths. |

### Ambiguities

1. **`inquiry.submitted` vs `inquiry.qualified`** — What distinguishes these? Is qualification automatic (stock check) or manual (rep review)? Document the qualification criteria.
2. **Quote revision limit** — Spec says "3 revisions" in decisions but state machine allows unlimited `v2_draft` → `v2_sent` loops. Enforce at application layer + DB constraint.
3. **Concurrent quote versions** — Can `v1_sent` and `v2_draft` exist simultaneously? Design assumes yes (negotiation), but `UNIQUE(inquiry_id, version)` allows it. Clarify: only ONE active version at a time (latest draft or sent).

---

## 2. Schema Soundness — Database Review

### Critical Issues

| Table | Issue | Fix |
|-------|-------|-----|
| `inquiries` | `expires_at` defined but no cron to auto-abandon | Add `abandon_inquiries` cron (daily, `status='draft' AND expires_at < now()`) |
| `quotes` | `valid_until` NOT NULL but no default; `created_at` default won't populate it | Add `valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')` or set in application |
| `quotes` | `currency` default 'MYR' but pricing in `*_usd` columns | **Naming inconsistency**: either rename columns to `*_myr` or store base currency as MYR and add `exchange_rate_usd` column |
| `stock_reservations` | `expires_at = quote.valid_until` per code, but quote can be revised → new `valid_until` | On quote revision, **must extend** all linked reservations' `expires_at` or create new ones |
| `orders` | `deposit_paid_usd` but no `balance_usd` or `balance_due_date` | Add computed columns or view for outstanding balance tracking |
| `customer_tiers` | Referenced in pricing but **no FK from `customers.tier_id`** | Add `tier_id UUID REFERENCES customer_tiers(id)` to `customers` table |

### Missing Indexes

```sql
-- Critical for reservation expiry cron (partial index exists but add composite)
CREATE INDEX idx_stock_reservations_quote_item ON stock_reservations(quote_item_id);

-- Quote version lookups
CREATE INDEX idx_quote_versions_quote_id_version ON quote_versions(quote_id, version DESC);

-- Admin kanban queries
CREATE INDEX idx_quotes_status_valid_until ON quotes(status, valid_until) WHERE status IN ('sent','viewed','negotiating');

-- Negotiation thread pagination
CREATE INDEX idx_negotiation_threads_quote_created ON negotiation_threads(quote_id, created_at DESC);
```

### Constraint Gaps

1. **Quote version monotonicity**: `quote_versions.version` should be `CHECK (version > 0)` and application must enforce sequential increments.
2. **Inquiry item configuration validation**: JSONB schema validation only at application layer. Add `CHECK (configuration IS NULL OR jsonb_typeof(configuration) = 'object')` minimum.
3. **Order → Quote immutability**: `orders.quote_id` is `ON DELETE SET NULL` but spec says "Immutable from quote". Change to `ON DELETE RESTRICT` and add trigger to prevent quote modification after order conversion.

### Data Type Concerns

- `unit_price_usd DECIMAL(10,2)` — Max 99,999,999.99. Sufficient for MYR (≈23M USD) but tight for IDR/VND if multi-currency expands. Use `DECIMAL(14,2)` for headroom.
- `configuration JSONB` — No versioning. When product schema changes, old inquiries become unreadable. Add `configuration_schema_version INT` to `inquiry_items` and `quote_items`.

---

## 3. API Completeness — Endpoint & Webhook Gaps

### Missing Endpoints

| Domain | Missing Endpoint | Purpose |
|--------|------------------|---------|
| **Inquiry** | `GET /api/v1/inquiries?status=draft&session_id=...` | Resume anonymous inquiry on return visit |
| **Inquiry** | `POST /api/v1/inquiries/:id/merge` | Merge anonymous session into authenticated customer on login |
| **Quote** | `GET /api/v1/quotes/:id/diff?from=v1&to=v2` | Structured diff for version comparison (UI needs this) |
| **Quote** | `PATCH /api/v1/quotes/:id/terms` | Update terms without full revision (lead time, valid_until) |
| **Stock** | `GET /api/v1/stock/check?product_id=&variant_id=&qty=` | Real-time availability check for Inquiry Builder |
| **Customer** | `POST /api/v1/customer/quotes/:id/request-revision` | Customer-initiated revision request (creates negotiation thread) |
| **Admin** | `POST /api/v1/admin/quotes/:id/extend-validity` | Extend quote validity (updates reservations) |
| **Admin** | `GET /api/v1/admin/dashboard/stats` | Funnel metrics: inquiries→quotes→orders conversion rates |

### Missing Webhook Events

| Event | Trigger | Downstream Need |
|-------|---------|-----------------|
| `quote.viewed` | Customer opens quote link | Sales rep notification, analytics |
| `quote.revised` | New version sent | Customer notification, PDF regen |
| `reservation.expired` | Cron releases stock | Inventory sync, rep alert if high-value |
| `inquiry.assigned` | Rep assigned | Rep notification (email/push) |
| `order.deposit_overdue` | Scheduled job | Finance dunning, rep escalation |
| `production.started` | Admin action | Customer notification, tracking init |

### Webhook Security

- **No signature verification** documented. Add `X-Lotten-Signature: sha256=...` header validation using shared secret.
- **No retry/backoff policy**. Document: 3 retries with exponential backoff (1m, 5m, 15m), then dead-letter queue.

---

## 4. Pricing Engine — Configuration Modifier Logic

### Soundness Issues

| Modifier | Issue | Risk |
|----------|-------|------|
| **Dimensions** | Formula `base × (custom_vol / std_vol)^0.7` assumes standard_volume exists per product. **Not in schema**. | Add `standard_dimensions JSONB` to `products` or `product_variants`. |
| **Dimensions** | No minimum price floor. Tiny custom size → price near zero. | Add `min_price_multiplier` (e.g., 0.7) per product. |
| **Finish** | Multipliers hardcoded in design doc. Not configurable per product. | Store in `products.finish_multipliers JSONB` for future SKU-specific overrides. |
| **Hardware/Upholstery** | Fixed MYR amounts. **Not currency-agnostic**. | Store as `base_currency_amount` + `currency` or use multiplier on base. |
| **Tier discount** | Applied at quote generation: `unit_price × (1 - tier.discount/100)`. **Stacks with config modifiers?** | Clarify order: base → config → tier → volume → quote-level discount. Document in spec. |

### Edge Cases Missed

1. **Volume discount** — "Customer tier + volume" in decisions but no volume logic in pricing engine. Add tiered volume breaks per product.
2. **Configuration incompatibility** — e.g., Leather upholstery + certain finishes. Schema `required` fields don't capture cross-field validation. Add `dependencies` or `allOf` in JSON Schema.
3. **Quote-level discount on configured items** — Discount applies to `subtotal` (post-config). Correct, but verify `discount_usd` doesn't exceed `subtotal`.
4. **Tax calculation** — `tax_usd` from `site_settings.tax_rate` but no address-based tax (Malaysia has SST, different rates for goods/services). Need `tax_jurisdiction` on shipping address.
5. **Rounding** — MYR rounds to nearest 0.05 (sen). Engine uses 2dp. Add `ROUND(total * 20) / 20` for MYR.

---

## 5. Stock Reservation — TTL & Race Conditions

### TTL Logic Flaws

| Issue | Current | Required |
|-------|---------|----------|
| **Reservation expiry = quote.valid_until** | Code sets `expiresAt: quote.validUntil` (30 days) | But `valid_until` can change on revision. **Must update reservations on every quote revision**. |
| **48h TTL mentioned in spec** | "48h TTL" in Phase B10 task | Code uses quote validity (30d). **Contradiction**. Decide: short TTL (48h) with auto-extension on view, or full quote validity. |
| **No grace period** | Expires exactly at `valid_until` | Add 24h buffer: `expires_at = valid_until + interval '24 hours'` for payment processing. |

### Race Condition Handling — **Inadequate**

```typescript
// CURRENT (vulnerable):
const available = await getAvailableStock(...);  // READ
if (available < item.quantity) throw ...;
await adjustStock(..., { available: -qty, reserved: +qty });  // WRITE
```

**Race window**: Two concurrent quotes check stock → both see available → both reserve → oversell.

**Required Fix — DB-Level Locking:**

```sql
-- In a single transaction with FOR UPDATE:
BEGIN;
SELECT available, reserved FROM product_stock 
WHERE product_id = $1 AND variant_id = $2 
FOR UPDATE;  -- locks row

-- Application logic validates, then:
UPDATE product_stock 
SET available = available - $3, reserved = reserved + $3
WHERE product_id = $1 AND variant_id = $2;

INSERT INTO stock_reservations ...;
COMMIT;
```

Or use advisory locks: `pg_advisory_xact_lock(hashtext(product_id || variant_id))`.

### Additional Gaps

- **No reservation for inquiry items** — Stock only reserved at quote generation. High-value items could sell out between inquiry submit and quote generation. Consider **soft hold** (24h) on inquiry submit.
- **Partial fulfillment** — If only 3 of 5 units available, current logic throws. Should support partial reservation with backorder flag.
- **Reservation release on quote reject** — Code only handles expiry. Add `releaseReservation(reservationId, 'quote_rejected')` call in `quote.reject` action.

---

## 6. Migration Safety — 4-Phase Plan Critique

### Phase 1 (Database) — **Risky**

| Step | Risk | Mitigation |
|------|------|------------|
| `RENAME carts → carts_deprecated` | **Breaks any remaining cart code** (analytics, admin, webhooks) | Run `grep -r "carts"` first. Ensure zero references. Do in maintenance window. |
| New RLS policies | **Locks out existing users** if policies wrong | Test on Supabase branch with production data snapshot. Use `pgTAP` for policy tests. |
| `products.configuration_schema` | **NULL default** breaks existing products | Add `DEFAULT '{"type":"object","properties":{}}'` and backfill from product metadata. |

### Phase 2 (Backend) — **Missing Idempotency**

- Quote generation, stock reservation, email sending — **no idempotency keys**. Network retry → duplicate quotes/reservations/emails. Add `Idempotency-Key` header to all mutating endpoints.

### Phase 3 (Frontend) — **No Feature Flags**

- Launching Inquiry Builder, Quote View, Admin pages all at once. **Use feature flags** (`NEXT_PUBLIC_INQUIRY_ENABLED`, `NEXT_PUBLIC_QUOTE_PORTAL_ENABLED`) for gradual rollout and instant rollback.

### Phase 4 (Cleanup) — **90-day grace too short**

- B2B quotes have 30-day validity + negotiation. **90 days minimum** before dropping deprecated tables. Keep `carts_deprecated` for 180 days.

### Rollback Procedures — **Not Documented**

Add explicit rollback per phase:
- **DB**: `pg_dump` before migration, `pg_restore` procedure documented.
- **Backend**: Blue-green deploy with Supabase edge functions; revert DNS.
- **Frontend**: Vercel instant rollback to previous deployment.

---

## 7. Scalability — B2B, Multi-Currency, Regional Tax

### B2B Volume

| Concern | Current Design | Gap |
|---------|----------------|-----|
| **Quote negotiation rounds** | Unlimited versions, full JSONB snapshot per version | 100+ item quotes × 5 versions × 1000 customers = large `quote_versions` table. Add **partitioning by `created_at` monthly**. |
| **Admin kanban queries** | `SELECT * FROM quotes WHERE status IN (...)` | No pagination cursor. Add keyset pagination (`WHERE (status, created_at) > (?, ?)`). |
| **Negotiation threads** | Flat table, no threading | B2B threads can hit 50+ messages. Add `parent_message_id` for replies, pagination. |

### Multi-Currency — **Not Supported**

- All `*_usd` columns but `currency` default 'MYR'. **Contradiction**.
- **Required changes**:
  - Add `exchange_rate_to_base DECIMAL(10,6)` to `quotes` and `orders`
  - Store prices in **base currency (MYR)**, convert on display
  - Add `currency_rates` table with daily rates from provider (BNM, ECB)
  - Customer tier pricing in base currency

### Regional Tax — **Not Supported**

- Single `tax_usd` from `site_settings.tax_rate`. Malaysia has:
  - SST 10% (Sales Tax) on goods
  - SST 6% (Service Tax) on services (delivery, installation)
  - Different rates for East Malaysia (Sabah/Sarawak)
- **Required**: `tax_jurisdiction` on address → `tax_rules(jurisdiction, rate, type)` table → calculate per line item.

---

## 8. Implementation Risk — Highest-Risk Components

### 🔴 **HIGHEST RISK: Stock Reservation + Quote Revision Concurrency**

**Why**: 
- Quote revisions extend validity → must extend reservations
- Concurrent revisions + cron expiry + order conversion = **triple race condition**
- Furniture has low SKU count, high unit value → oversell = catastrophic (custom oak, 8-week lead time)

**Will Cause Delays**: 
- Getting `SELECT FOR UPDATE` right across distributed Server Actions
- Testing all interleavings (revise + cron + accept simultaneous)
- **Estimate: +1 week** for correct implementation + chaos testing

### 🟡 **HIGH RISK: Configuration Schema Evolution**

**Why**:
- JSON Schema in `products.configuration_schema` changes over time
- Old inquiries/quotes become invalid/unreadable
- Migration of historical `configuration` JSONB is non-trivial

**Will Cause Delays**:
- Versioning strategy (schema_version per item) adds complexity to UI generator
- Backfill script for 100+ existing products
- **Estimate: +3-5 days**

### 🟡 **HIGH RISK: PDF Generation at Scale**

**Why**:
- Quote PDF must match exactly what customer accepts (legal document)
- React-PDF or Puppeteer in Serverless (Vercel/Cloudflare) has **cold start + timeout risks**
- 50 concurrent quote sends → 50 PDF gens → function timeout

**Will Cause Delays**:
- Async queue (Supabase pg_cron + edge function) needed
- Template pixel-perfect matching with design system
- **Estimate: +1 week**

### 🟢 **MEDIUM RISK: Anonymous → Authenticated Inquiry Merge**

**Why**:
- Hybrid persistence (session_id → customer_id on login) requires **client-side coordination**
- Edge cases: multiple devices, expired session, merge conflicts

**Mitigation**: Ship simple version first (no merge), add merge in Phase 3.1.

---

## 9. Summary — Conditional Approvement

| Category | Status | Blocker? |
|----------|--------|----------|
| State Machine | ⚠️ Needs fixes | No |
| Database Schema | ⚠️ Needs fixes | **Yes** (currency/tax, FKs) |
| API Completeness | ⚠️ Gaps identified | No |
| Pricing Engine | ⚠️ Edge cases | No |
| Stock Reservation | 🔴 Race conditions | **Yes** |
| Migration Safety | ⚠️ Rollback missing | No |
| Scalability | ⚠️ Multi-currency/tax | **Yes** (post-MVP) |
| Implementation Risk | 🔴 High | N/A |

### **Must-Fix Before Implementation Kickoff**

1. **Stock reservation concurrency** — Implement `SELECT FOR UPDATE` pattern in `lib/actions/stock.ts`
2. **Currency column naming** — Decide: MYR-native (rename `*_usd` → `*_myr`) or multi-currency (add `exchange_rate`, `base_currency`)
3. **Quote revision → reservation extension** — Add explicit logic in `quote.revise` action
4. **Configuration schema versioning** — Add `configuration_schema_version` to `inquiry_items`, `quote_items`, `order_items`
5. **Rollback procedures** — Document per-phase rollback in SPEC.md

### **Recommended Deferrals (Post-MVP)**

- Multi-currency / regional tax (Phase C+)
- Volume discount tiers (Phase C+)
- Approval workflows for high-value quotes (Phase C+)
- Partial reservation / backorder (Phase C+)

---

**Verdict**: **APPROVED WITH CONDITIONS**. Address 5 must-fix items above, then proceed. Schedule 30-min architecture sync with Engineering Lead to review stock reservation locking implementation before Phase 2 kickoff.

---

*Document: 20260729-phase0-inquiry-quote-design.md*  
*Next: Stakeholder review → SPEC.md update → Implementation kickoff*

---

# SYSTEMS ARCHITECT REVIEW — Phase 0 Design Sprint

*Review completed: 2026-07-29*  
*Reviewer: Independent subagent with no context from original design*

---

## Executive Verdict

**The design is structurally sound for a v1 Inquiry→Quote→Order system** but has **critical gaps in state machine completeness, schema constraints, pricing edge cases, and migration safety** that will cause production incidents if shipped as-is. The document reads like a "happy path" specification — it assumes valid inputs, sequential transitions, and no concurrent operations.

**Risk Level: HIGH** — Multiple areas require redesign before implementation.

---

## 1. State Machine Correctness — CRITICAL GAPS

### 1.1 Missing States

| Entity | Missing State | Why Required |
|--------|---------------|--------------|
| **Inquiry** | `on_hold` | Customer requests pause; sales rep needs time to source special finish |
| **Inquiry** | `cancelled` | Distinct from `abandoned` — explicit customer cancellation vs timeout |
| **Quote** | `pending_approval` | B2B: quote > MYR 50k requires manager approval before `sent` |
| **Quote** | `partially_accepted` | Customer accepts 3 of 5 line items; remaining need revision |
| **Order** | `on_hold` | Production delay, material shortage, payment issue |
| **Order** | `returned` | Post-delivery returns (warranty, damage) |
| **StockReservation** | `partially_released` | Partial fulfillment from reservation |

### 1.2 Invalid/Undocumented Transitions

```
CURRENT DOCUMENTED:
Inquiry: draft → submitted → qualified → quoted
Quote: v1_draft → v1_sent → v2_draft → v2_sent → accepted/rejected/expired

MISSING TRANSITIONS:
- Inquiry: quoted → submitted (customer adds items after quote)
- Quote: accepted → sent (customer rejects, rep revises, re-sends)
- Quote: negotiating → sent (verbal agreement, formal resend)
- Order: confirmed → on_hold → production (pause/resume)
- Order: delivered → returned → refunded
- StockReservation: active → partially_released → converted
```

### 1.3 No Concurrency Model

**Critical:** No handling for:
- Two reps editing same quote simultaneously → lost updates
- Customer accepts quote v2 while rep sends v3 → version conflict
- Stock reservation expires while quote being accepted → race condition

**Required:** Optimistic locking (`version` column on all entities) + application-level conflict resolution.

---

## 2. Schema Soundness — SIGNIFICANT ISSUES

### 2.1 Foreign Key Gaps

```sql
-- inquiry_items: missing FK to configuration schema version
configuration_schema_version INT REFERENCES product_configuration_schemas(version)

-- quotes: missing FK to pricing_rule_snapshot
pricing_rule_snapshot_id UUID REFERENCES pricing_rule_snapshots(id)

-- orders: missing FK to payment_gateway (for deposit tracking)
payment_gateway_id UUID REFERENCES payment_gateways(id)
deposit_transaction_id UUID
```

### 2.2 Constraint Weaknesses

| Table | Missing Constraint | Risk |
|-------|-------------------|------|
| `inquiry_items` | `CHECK (quantity <= product.moq)` | Customer orders below MOQ |
| `quotes` | `CHECK (valid_until > created_at + INTERVAL '1 day')` | Zero/negative validity |
| `quotes` | `CHECK (deposit_percent BETWEEN 0 AND 100)` | Invalid deposit % |
| `stock_reservations` | `CHECK (expires_at > reserved_at)` | Negative TTL |
| `negotiation_threads` | `CHECK (NOT (is_internal AND participant_id = customer_id))` | Internal note visible to customer |

### 2.3 Missing Columns

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `inquiries` | `utm_source`, `utm_medium`, `utm_campaign` | TEXT | Marketing attribution |
| `inquiries` | `ip_address`, `user_agent` | TEXT | Fraud detection, geo-pricing |
| `quotes` | `pricing_engine_version` | TEXT | Replay pricing for disputes |
| `quotes` | `tax_calculation_method` | TEXT | 'inclusive'/'exclusive', per jurisdiction |
| `orders` | `production_deadline` | DATE | SLA tracking |
| `stock_reservations` | `warehouse_id` | UUID | Multi-warehouse (Phase D) |
| `products` | `configuration_schema_version` | INT | Schema migration tracking |
| `products` | `pricing_rule_set_id` | UUID | Decouple pricing from product |

### 2.4 Index Gaps

```sql
-- Missing critical indexes:
CREATE INDEX idx_quotes_customer_status_valid ON quotes(inquiry_id, status, valid_until) 
  WHERE status IN ('sent','viewed','negotiating'); -- dashboard queries

CREATE INDEX idx_stock_reservations_product_active ON stock_reservations(product_id, variant_id)
  WHERE status = 'active'; -- stock availability check

CREATE INDEX idx_orders_production_deadline ON orders(production_deadline)
  WHERE status IN ('confirmed','production'); -- production planning

CREATE INDEX idx_inquiries_session_status ON inquiries(session_id, status)
  WHERE status = 'draft'; -- anonymous cart recovery
```

---

## 3. API Completeness — MISSING ENDPOINTS

### 3.1 Webhook Events Not Specified

| Event | Payload | Consumer |
|-------|---------|----------|
| `inquiry.submitted` | inquiry_id, customer_id, items[] | CRM, Analytics |
| `inquiry.merged` | old_session_id, new_customer_id | Analytics |
| `quote.generated` | quote_id, version, pdf_url | Email, Customer Portal |
| `quote.viewed` | quote_id, viewer_ip | Sales rep notification |
| `quote.accepted` | quote_id, accepted_items[] | Order creation, Payment |
| `quote.rejected` | quote_id, reason | Rep notification |
| `quote.expired` | quote_id | Stock release, Analytics |
| `stock.reservation.created` | reservation_id, quote_id, expires_at | Inventory |
| `stock.reservation.released` | reservation_id, reason | Inventory, Analytics |
| `order.converted_from_quote` | order_id, quote_id | ERP, Accounting |
| `negotiation.message_added` | thread_id, quote_id, participant | Real-time UI |

### 3.2 Missing REST Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/inquiries/:id/merge` | POST — merge anonymous session to customer |
| `POST /api/v1/quotes/:id/approve` | Manager approval for high-value quotes |
| `POST /api/v1/quotes/:id/partial-accept` | Accept subset of line items |
| `GET /api/v1/quotes/:id/diff/:v1/:v2` | Version comparison for negotiation |
| `POST /api/v1/stock/reservations/bulk-check` | Check availability for multiple items |
| `GET /api/v1/inquiries/:id/export` | CSV/PDF for sales rep handoff |
| `POST /api/v1/orders/:id/hold` / `POST /api/v1/orders/:id/resume` | Production pause/resume |

---

## 4. Pricing Engine — EDGE CASES MISSED

### 4.1 Configuration Modifier Logic

```typescript
// Document formula:
line_total = base_price * finish_mult * dimension_mult + hardware_add + upholstery_add

// MISSING HANDLING:
- finish_mult per finish_code (not global): Cocoa=1.15, Walnut=1.10, Natural=1.00
- dimension_mult: (width*depth*height)^0.7 / reference_volume — BUT minimum 1.0 (no discount for smaller)
- hardware_add: per item, not per line — 2 cabinets = 2× hardware cost
- upholstery_add: per seat, not per item — sofa 3-seater = 3× upholstery
- tiered pricing: volume discount applies AFTER configuration modifiers
- trade pricing: tier discount applies to BASE price, not configured price (industry standard)
```

### 4.2 Decimal Precision

```sql
-- Current: DECIMAL(10,2) for unit_price_usd
-- REQUIRED: DECIMAL(12,4) for intermediate calculations
-- Example: base=1234.56 * finish=1.15 * dim=1.073 = 1523.456789 → round to 1523.46
-- Banker's rounding (ROUND_HALF_EVEN) required for financial compliance
```

### 4.3 Tax Calculation

```typescript
// Document says "MYR only, tax-inclusive"
// MISSING:
- Tax jurisdiction per shipping address (Malaysia states have different SST)
- Tax on deposit vs full amount (deposit may be pre-tax)
- Tax exemption for B2B with valid GST number
- Tax rounding: per-line vs per-invoice (Malaysia requires per-line)
```

### 4.4 Currency (Future-Proofing)

```sql
-- quotes.currency default 'MYR' — but B2B quotes often USD/SGD
-- MISSING: exchange_rate DECIMAL(12,6), exchange_rate_date DATE, base_currency TEXT
-- Price lock: quote locks exchange rate at generation
```

---

## 5. Stock Reservation — RACE CONDITIONS

### 5.1 Current Design Flaw

```sql
-- Document: "Use DB transactions + SELECT FOR UPDATE"
-- BUT: Reservation creation and quote acceptance are SEPARATE transactions

BEGIN; -- Txn 1: Create quote + reservations
  INSERT INTO quotes ...
  INSERT INTO stock_reservations ... -- SELECT FOR UPDATE on products/variants
COMMIT;

-- LATER (minutes/hours):
BEGIN; -- Txn 2: Accept quote
  UPDATE quotes SET status='accepted' WHERE id=$1;
  -- NO stock check here! Reservation assumed valid.
COMMIT;
```

**Race:** Reservation expires (cron runs) BETWEEN quote creation and acceptance → acceptance succeeds but stock gone.

### 5.2 Required: Atomic Acceptance

```sql
CREATE OR REPLACE FUNCTION accept_quote(p_quote_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- Single transaction: validate all reservations still active
  FOR v_reservation IN 
    SELECT sr.* FROM stock_reservations sr
    JOIN quote_items qi ON qi.reservation_id = sr.id
    WHERE qi.quote_id = p_quote_id AND sr.status = 'active'
    FOR UPDATE OF sr -- Lock reservations
  LOOP
    IF v_reservation.expires_at < NOW() THEN
      RAISE EXCEPTION 'Reservation % expired', v_reservation.id;
    END IF;
  END LOOP;

  -- All valid: convert to order
  INSERT INTO orders ... SELECT ... FROM quotes WHERE id = p_quote_id;
  UPDATE stock_reservations SET status='converted', converted_at=NOW() 
    WHERE quote_id = p_quote_id;
  UPDATE quotes SET status='accepted', accepted_at=NOW() WHERE id = p_quote_id;
END;
$$;
```

### 5.3 Cron Release — Missing Idempotency

```sql
-- Current: "cron release expired reservations"
-- MISSING: Idempotency key to prevent double-release on cron overlap
CREATE TABLE stock_reservation_release_log (
  reservation_id UUID PRIMARY KEY REFERENCES stock_reservations(id),
  released_at TIMESTAMPTZ DEFAULT NOW(),
  released_by TEXT DEFAULT 'cron'
);
-- Cron: INSERT ... ON CONFLICT DO NOTHING
```

---

## 6. Migration Safety — ROLLBACK INADEQUATE

### 6.1 Phase 1 (Database) — No Down Migration

```sql
-- Document: "Phase 1: Create new tables"
-- MISSING: Corresponding DROP statements for rollback

-- Required in migration file:
-- UP:
CREATE TABLE inquiries (...);
-- DOWN:
DROP TABLE IF EXISTS negotiation_threads;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS stock_reservations;
DROP TABLE IF EXISTS quote_versions;
DROP TABLE IF EXISTS quote_items;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS inquiry_items;
DROP TABLE IF EXISTS inquiries;
```

### 6.2 Phase 2 (Soft Deprecate Cart) — Data Loss Risk

```sql
-- Document: "Soft-deprecate carts (rename, not drop)"
-- MISSING: Data migration from carts → inquiries for active sessions

-- Required:
INSERT INTO inquiries (session_id, status, created_at, updated_at)
SELECT session_id, 'draft', created_at, updated_at
FROM carts WHERE updated_at > NOW() - INTERVAL '30 days';

INSERT INTO inquiry_items (inquiry_id, product_id, variant_id, quantity, configuration)
SELECT i.id, ci.product_id, ci.variant_id, ci.quantity, 
  jsonb_build_object('finish', ci.finish, 'dimensions', ci.dimensions)
FROM cart_items ci
JOIN inquiries i ON i.session_id = ci.cart_id
WHERE ci.updated_at > NOW() - INTERVAL '30 days';
```

### 6.3 No Migration Testing Plan

| Test | Required |
|------|----------|
| Run on Supabase branch (production copy) | ✅ |
| Verify FK/RLS policies work | ✅ |
| Benchmark stock reservation contention (100 concurrent) | ❌ |
| Test rollback restores cart functionality | ❌ |
| Verify analytics backfill correctness | ❌ |

---

## 7. Scalability — B2B VOLUME GAPS

### 7.1 Multi-Currency

```sql
-- quotes.currency = 'MYR' only
-- REQUIRED for B2B:
ALTER TABLE quotes ADD COLUMN base_currency TEXT DEFAULT 'MYR';
ALTER TABLE quotes ADD COLUMN exchange_rate DECIMAL(12,6);
ALTER TABLE quotes ADD COLUMN exchange_rate_date DATE;
-- Price lock: exchange_rate fixed at quote generation
```

### 7.2 Regional Tax

```sql
-- Missing: tax_jurisdiction on quotes/orders
ALTER TABLE quotes ADD COLUMN tax_jurisdiction TEXT; -- 'MY-PNG', 'MY-KUL', 'SG', 'US-CA'
ALTER TABLE quotes ADD COLUMN tax_rate DECIMAL(5,4); -- 0.0600 for 6% SST
ALTER TABLE quotes ADD COLUMN tax_calculation_method TEXT DEFAULT 'per_line'; -- 'per_line' | 'per_invoice'
```

### 7.3 High-Volume Stock Reservations

```sql
-- Current: row-level locks on products table
-- At 1000 concurrent reservations: lock contention
-- REQUIRED: Partition stock_reservations by product_id
-- OR: Use advisory locks (pg_advisory_xact_lock) for reservation creation
```

### 7.4 Quote PDF Generation at Scale

```typescript
// Document: "Async generation, cache PDF URL"
// MISSING: Queue depth monitoring, timeout handling, retry with backoff
// At 100 quotes/minute: need worker pool, not single cron
```

---

## 8. Implementation Risk — HIGHEST RISK COMPONENTS

| Rank | Component | Why High Risk | Mitigation |
|------|-----------|---------------|------------|
| **1** | **Stock Reservation + Quote Acceptance Atomicity** | Distributed transaction across reservation validity, quote status, order creation. Race conditions = oversell. | Implement as single PL/pgSQL function; add integration test with concurrent acceptance. |
| **2** | **Pricing Engine Configuration Modifiers** | Floating-point precision, per-finish multipliers, dimension exponentiation, tiered discount order. Financial discrepancies = legal risk. | Property-based testing (fast-check); fixed-point arithmetic; audit log every calculation. |
| **3** | **Quote Versioning + Negotiation Thread** | Optimistic locking conflicts; customer accepts v2 while rep sends v3; partial acceptance. | Version column on quotes; conflict resolution UI; partial acceptance API. |
| **4** | **Migration: Cart → Inquiry Data Transfer** | Active anonymous carts must become inquiries without data loss. Session mapping complexity. | Dry-run on staging; verify row counts; feature flag rollback. |
| **5** | **PDF Generation Pipeline** | Async, external service (React-PDF/Chrome), failure modes: timeout, OOM, layout break. | Dedicated queue (BullMQ/pg-boss); health checks; fallback to HTML email. |

---

## 9. Required Changes Before Implementation

### Must Fix (Blockers)

1. **Add missing states** to all state machines (`on_hold`, `cancelled`, `pending_approval`, `partially_accepted`)
2. **Add optimistic locking** (`version` column) to `inquiries`, `quotes`, `orders`, `stock_reservations`
3. **Implement atomic quote acceptance** as single DB function with reservation validation
4. **Add pricing precision** (DECIMAL(12,4)), banker's rounding, tax jurisdiction
5. **Write DOWN migrations** for every UP migration
6. **Add webhook event specifications** with payload schemas

### Should Fix (Pre-Launch)

7. **Add configuration schema versioning** on products
8. **Add pricing rule snapshots** on quotes
9. **Implement idempotent cron** for stock release
10. **Add multi-currency/tax columns** (nullable, for Phase D)
11. **Write integration tests** for concurrent quote acceptance, pricing edge cases

### Nice to Have (Post-Launch)

12. **Customer portal real-time updates** (Supabase Realtime on quotes)
13. **Quote diff API** for negotiation UI
14. **Analytics backfill script** for historical cart→inquiry migration

---

## Summary Scorecard

| Dimension | Design Score | Production Ready? | Gap |
|-----------|--------------|-------------------|-----|
| State Machine | 5/10 | ❌ | Missing states, transitions, concurrency |
| Schema | 6/10 | ❌ | FK gaps, weak constraints, missing columns, indexes |
| API | 6/10 | ❌ | Missing webhooks, endpoints, partial acceptance |
| Pricing Engine | 4/10 | ❌ | Precision, tax, edge cases, trade pricing order |
| Stock Reservation | 5/10 | ❌ | Race condition in acceptance, cron idempotency |
| Migration | 4/10 | ❌ | No down migrations, no data transfer, no test plan |
| Scalability | 5/10 | ⚠️ | No multi-currency, regional tax, partitioning |
| **Overall** | **4.9/10** | **❌ NOT READY** | **Blockers in state machine, pricing, migration, stock** |

---

## Final Recommendation

**DO NOT START IMPLEMENTATION** until:

1. State machine redesigned with all states/transitions + concurrency model
2. Pricing engine specified with fixed-point arithmetic + tax jurisdiction
3. Atomic quote acceptance function written and load-tested
4. Full migration scripts (UP/DOWN) written and tested on Supabase branch
5. Webhook event contracts agreed with CRM/Analytics teams

**Estimated additional design time: 1-2 weeks.** The current document is a "happy path" specification — production systems fail on the unhappy paths this document doesn't cover.

---

*Systems Architect Review completed: 2026-07-29*  
*Reviewer: Senior Systems Architect (independent subagent)*