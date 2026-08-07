-- Phase 1: Inquiry → Quote → Order System
-- Migration 006: Core tables for inquiry/quote/order workflow
-- Replaces cart/checkout with B2B-ready quote system for Malaysian Oak furniture

-- ============================================================================
-- EXTENSION: Ensure uuid-ossp is available (already in 001, but safe to repeat)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: inquiries
-- Customer intent capture (replaces cart). Hybrid: anonymous session_id → customer on login
-- ============================================================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,  -- NULL = anonymous
  session_id TEXT NOT NULL,  -- for anonymous tracking; merged on login
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- building inquiry, not submitted
    'submitted',       -- customer sent to sales
    'qualified',       -- sales rep reviewed, ready to quote
    'quoted',          -- quote generated
    'on_hold',         -- customer paused (special finish sourcing, etc.)
    'cancelled',       -- explicit customer cancellation
    'abandoned'        -- 30d idle timeout (cron)
  )),
  source_channel TEXT DEFAULT 'web' CHECK (source_channel IN (
    'web', 'showroom', 'phone', 'email', 'referral'
  )),
  assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,  -- customer notes
  internal_notes TEXT,  -- sales rep notes
  -- Timestamps for funnel analytics
  submitted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- inquiry auto-abandon after 30 days
  -- UTM attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  -- Technical
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for inquiries
CREATE INDEX idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX idx_inquiries_session_id ON inquiries(session_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_assigned_rep ON inquiries(assigned_rep_id);
CREATE INDEX idx_inquiries_expires_at ON inquiries(expires_at) WHERE status IN ('draft','submitted','qualified');
CREATE INDEX idx_inquiries_session_status ON inquiries(session_id, status) WHERE status = 'draft';

-- RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own inquiries" ON inquiries FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Rep assigned inquiries" ON inquiries FOR ALL USING (
  assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'
);
CREATE POLICY "Admin all inquiries" ON inquiries FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Anon insert draft" ON inquiries FOR INSERT WITH CHECK (true);  -- anon can create draft

-- ============================================================================
-- TABLE: inquiry_items
-- Product + configuration per line (replaces cart_items)
-- ============================================================================
CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Configuration captured at inquiry time (finish, dimensions, hardware, upholstery)
  -- Validated against products.configuration_schema (JSON Schema)
  configuration JSONB NOT NULL DEFAULT '{}',
  -- Pricing (nullable until quoted)
  unit_price_usd DECIMAL(12,4),  -- quoted price (4 decimal precision for calc)
  line_total_usd DECIMAL(14,4),
  notes TEXT,  -- customer special requests
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);
CREATE INDEX idx_inquiry_items_product_id ON inquiry_items(product_id);

-- RLS
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own inquiry items" ON inquiry_items FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid())
);
CREATE POLICY "Rep inquiry items" ON inquiry_items FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin')
);
CREATE POLICY "Admin all inquiry items" ON inquiry_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Anon insert draft items" ON inquiry_items FOR INSERT WITH CHECK (
  inquiry_id IN (SELECT id FROM inquiries WHERE status = 'draft')
);

-- ============================================================================
-- TABLE: quotes
-- Versioned, priced, reservable artifact (core B2B object)
-- ============================================================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE RESTRICT,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- internal draft, not sent
    'pending_approval', -- > MYR 50k requires manager approval
    'sent',            -- emailed to customer
    'viewed',          -- customer opened PDF/link
    'negotiating',     -- active discussion
    'accepted',        -- customer accepted
    'rejected',        -- customer declined
    'expired',         -- valid_until passed
    'partially_accepted' -- some line items accepted
  )),
  quote_number TEXT NOT NULL UNIQUE,  -- 'Q-2026-00123-v1'
  -- Pricing (locked at generation)
  subtotal_usd DECIMAL(14,4) NOT NULL,
  discount_usd DECIMAL(14,4) DEFAULT 0,
  tax_usd DECIMAL(14,4) DEFAULT 0,
  shipping_usd DECIMAL(14,4) DEFAULT 0,
  total_usd DECIMAL(14,4) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  -- Multi-currency support (Phase D)
  base_currency TEXT DEFAULT 'MYR',
  exchange_rate DECIMAL(12,6),
  exchange_rate_date DATE,
  -- Tax jurisdiction
  tax_jurisdiction TEXT,  -- 'MY-PNG', 'MY-KUL', 'SG', etc.
  tax_rate DECIMAL(5,4),  -- 0.0600 for 6% SST
  tax_calculation_method TEXT DEFAULT 'per_line' CHECK (tax_calculation_method IN ('per_line','per_invoice')),
  -- Terms
  payment_terms_days INT DEFAULT 30,
  deposit_percent INT DEFAULT 50 CHECK (deposit_percent BETWEEN 0 AND 100),
  lead_time_weeks INT,
  -- Validity
  valid_until TIMESTAMPTZ NOT NULL,
  -- Versioning
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,  -- for v2, v3...
  change_summary TEXT,  -- "v2: Reduced finish upcharge 15%→10%"
  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  -- Audit
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  viewed_by_ip INET,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_by UUID REFERENCES auth.users(id),  -- sales rep
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraints
  UNIQUE (inquiry_id, version),
  CHECK (valid_until > created_at + INTERVAL '1 day'),
  CHECK (deposit_percent BETWEEN 0 AND 100)
);

-- Indexes
CREATE INDEX idx_quotes_inquiry_id ON quotes(inquiry_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until) WHERE status IN ('sent','viewed','negotiating');
CREATE INDEX idx_quotes_customer_status_valid ON quotes(inquiry_id, status, valid_until) 
  WHERE status IN ('sent','viewed','negotiating');
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own quotes" ON quotes FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid())
);
CREATE POLICY "Rep quotes" ON quotes FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) 
  OR (auth.jwt() ->> 'role') = 'admin'
);
CREATE POLICY "Admin all quotes" ON quotes FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: quote_items
-- Snapshotted from inquiry_items at quote generation (immutable pricing)
-- ============================================================================
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  inquiry_item_id UUID REFERENCES inquiry_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  -- Frozen configuration snapshot
  configuration JSONB NOT NULL,
  -- Locked pricing
  unit_price_usd DECIMAL(12,4) NOT NULL,
  line_total_usd DECIMAL(14,4) NOT NULL,
  -- Stock reservation link
  reservation_id UUID,  -- FK added after stock_reservations table
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_reservation_id ON quote_items(reservation_id);

-- RLS
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own quote items" ON quote_items FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid()))
);
CREATE POLICY "Rep quote items" ON quote_items FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
CREATE POLICY "Admin all quote items" ON quote_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: quote_versions
-- Negotiation audit trail (full snapshot per version)
-- ============================================================================
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  -- Full snapshot for diff/comparison
  snapshot JSONB NOT NULL,  -- { items: [...], pricing: {...}, terms: {...} }
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id, version)
);

-- Index
CREATE INDEX idx_quote_versions_quote_id ON quote_versions(quote_id);

-- RLS
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rep quote versions" ON quote_versions FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
CREATE POLICY "Admin all quote versions" ON quote_versions FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: stock_reservations
-- Time-bound holds for quoted items (prevents oversell on unique slabs)
-- ============================================================================
CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',       -- reserved for quote
    'released',     -- quote expired/rejected, stock returned
    'converted',    -- quote accepted → order, stock committed
    'expired',      -- TTL passed, cron will release
    'partially_released' -- partial fulfillment
  )),
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,  -- = quote.valid_until + buffer
  converted_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  released_reason TEXT,  -- 'quote_expired', 'quote_rejected', 'manual', 'partial_fulfillment'
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (expires_at > reserved_at)
);

-- Indexes
CREATE INDEX idx_stock_reservations_quote_id ON stock_reservations(quote_id);
CREATE INDEX idx_stock_reservations_status_expires ON stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_stock_reservations_product_active ON stock_reservations(product_id, variant_id) WHERE status = 'active';

-- RLS
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rep stock reservations" ON stock_reservations FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
CREATE POLICY "Admin all stock reservations" ON stock_reservations FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- Add FK from quote_items to stock_reservations (after both exist)
ALTER TABLE quote_items 
  ADD CONSTRAINT fk_quote_items_reservation 
  FOREIGN KEY (reservation_id) REFERENCES stock_reservations(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: orders
-- Actual orders (from quote conversion or direct)
-- Separate from quotes — incompatible column sets
-- Replaces the cart-era orders/order_items tables from 001_initial_schema.sql
-- ============================================================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,  -- NULL = direct order
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,  -- 'ORD-2026-00123'
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'confirmed',      -- deposit paid, ready for production
    'production',     -- in manufacturing
    'shipped',        -- dispatched
    'delivered',      -- received by customer
    'cancelled',      -- cancelled before production
    'on_hold',        -- production pause (material delay, payment issue)
    'returned'        -- post-delivery return
  )),
  -- Pricing (copied from quote at conversion)
  subtotal_usd DECIMAL(14,4) NOT NULL,
  discount_usd DECIMAL(14,4) DEFAULT 0,
  tax_usd DECIMAL(14,4) DEFAULT 0,
  shipping_usd DECIMAL(14,4) DEFAULT 0,
  total_usd DECIMAL(14,4) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  base_currency TEXT DEFAULT 'MYR',
  exchange_rate DECIMAL(12,6),
  exchange_rate_date DATE,
  tax_jurisdiction TEXT,
  tax_rate DECIMAL(5,4),
  tax_calculation_method TEXT DEFAULT 'per_line' CHECK (tax_calculation_method IN ('per_line','per_invoice')),
  payment_terms_days INT DEFAULT 30,
  deposit_percent INT DEFAULT 50 CHECK (deposit_percent BETWEEN 0 AND 100),
  deposit_paid_usd DECIMAL(14,4) DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,
  deposit_transaction_id UUID,  -- payment gateway ref
  payment_gateway_id UUID,      -- payment gateway ref
  -- Fulfillment
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  delivered_date DATE,
  production_deadline DATE,  -- SLA tracking
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

-- Indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_quote_id ON orders(quote_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_production_deadline ON orders(production_deadline) WHERE status IN ('confirmed','production');

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own orders" ON orders FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Rep orders" ON orders FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) 
  OR quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()))
  OR (auth.jwt() ->> 'role') = 'admin'
);
CREATE POLICY "Admin all orders" ON orders FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: order_items
-- Snapshot from quote_items at conversion (immutable)
-- ============================================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  configuration JSONB NOT NULL,
  unit_price_usd DECIMAL(12,4) NOT NULL,
  line_total_usd DECIMAL(14,4) NOT NULL,
  production_status TEXT DEFAULT 'pending' CHECK (production_status IN ('pending','in_production','completed','shipped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_quote_item_id ON order_items(quote_item_id);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);
CREATE POLICY "Rep order items" ON order_items FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) OR quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid())) OR (auth.jwt() ->> 'role') = 'admin')
);
CREATE POLICY "Admin all order items" ON order_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: negotiation_threads
-- B2B quote discussion (customer ↔ sales rep)
-- ============================================================================
CREATE TABLE negotiation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- customer or rep
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,  -- true = rep-only note
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_negotiation_threads_quote_id ON negotiation_threads(quote_id);

-- RLS
ALTER TABLE negotiation_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer negotiation" ON negotiation_threads FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid()))
  AND is_internal = false
);
CREATE POLICY "Rep negotiation" ON negotiation_threads FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
CREATE POLICY "Admin all negotiation" ON negotiation_threads FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: product_configuration_schemas
-- Versioned JSON Schema for inquiry_items.configuration validation
-- ============================================================================
CREATE TABLE product_configuration_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  schema JSONB NOT NULL,  -- JSON Schema Draft 7
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, version)
);

-- Index
CREATE INDEX idx_product_config_schemas_product ON product_configuration_schemas(product_id);

-- RLS
ALTER TABLE product_configuration_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active schemas" ON product_configuration_schemas FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage schemas" ON product_configuration_schemas FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: pricing_rule_snapshots
-- Immutable pricing rules at quote generation (audit/replay)
-- ============================================================================
CREATE TABLE pricing_rule_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  rules JSONB NOT NULL,  -- { finish_multipliers: {...}, dimension_exponent: 0.7, ... }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_pricing_snapshots_quote ON pricing_rule_snapshots(quote_id);

-- RLS
ALTER TABLE pricing_rule_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rep pricing snapshots" ON pricing_rule_snapshots FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
CREATE POLICY "Admin all pricing snapshots" ON pricing_rule_snapshots FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- TABLE: stock_reservation_release_log
-- Idempotency for cron release (prevents double-release on overlap)
-- ============================================================================
CREATE TABLE stock_reservation_release_log (
  reservation_id UUID PRIMARY KEY REFERENCES stock_reservations(id) ON DELETE CASCADE,
  released_at TIMESTAMPTZ DEFAULT now(),
  released_by TEXT DEFAULT 'cron'
);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiry_items_updated_at BEFORE UPDATE ON inquiry_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Atomic Quote Acceptance (prevents race condition)
-- Validates all reservations still active, converts to order in single transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION accept_quote(p_quote_id UUID, p_customer_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_quote RECORD;
  v_inquiry RECORD;
  v_order_id UUID;
  v_reservation RECORD;
  v_reservation_count INT;
  v_active_reservation_count INT;
BEGIN
  -- Lock quote row
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', p_quote_id;
  END IF;
  
  IF v_quote.status NOT IN ('sent','viewed','negotiating') THEN
    RAISE EXCEPTION 'Quote % not in acceptable state (current: %)', p_quote_id, v_quote.status;
  END IF;
  
  IF v_quote.valid_until < NOW() THEN
    RAISE EXCEPTION 'Quote % expired on %', p_quote_id, v_quote.valid_until;
  END IF;
  
  -- Verify customer owns this quote
  SELECT * INTO v_inquiry FROM inquiries WHERE id = v_quote.inquiry_id;
  IF v_inquiry.customer_id IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Customer % not authorized for quote %', p_customer_id, p_quote_id;
  END IF;
  
  -- Validate ALL reservations still active and not expired
  SELECT count(*) INTO v_reservation_count
  FROM stock_reservations sr
  JOIN quote_items qi ON qi.reservation_id = sr.id
  WHERE qi.quote_id = p_quote_id;
  
  SELECT count(*) INTO v_active_reservation_count
  FROM stock_reservations sr
  JOIN quote_items qi ON qi.reservation_id = sr.id
  WHERE qi.quote_id = p_quote_id
    AND sr.status = 'active'
    AND sr.expires_at > NOW()
  FOR UPDATE OF sr;  -- Lock reservations
  
  IF v_reservation_count != v_active_reservation_count THEN
    RAISE EXCEPTION 'Some reservations expired or released: % of % active', v_active_reservation_count, v_reservation_count;
  END IF;
  
  -- All valid: create order
  INSERT INTO orders (
    quote_id, inquiry_id, order_number, customer_id,
    subtotal_usd, discount_usd, tax_usd, shipping_usd, total_usd,
    currency, base_currency, exchange_rate, exchange_rate_date,
    tax_jurisdiction, tax_rate, tax_calculation_method,
    payment_terms_days, deposit_percent,
    shipping_address, billing_address,
    estimated_ship_date, production_deadline,
    customer_notes, internal_notes
  ) SELECT 
    v_quote.id, v_quote.inquiry_id, 'ORD-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('orders_order_number_seq')::text, 6, '0'),
    v_inquiry.customer_id,
    v_quote.subtotal_usd, v_quote.discount_usd, v_quote.tax_usd, v_quote.shipping_usd, v_quote.total_usd,
    v_quote.currency, v_quote.base_currency, v_quote.exchange_rate, v_quote.exchange_rate_date,
    v_quote.tax_jurisdiction, v_quote.tax_rate, v_quote.tax_calculation_method,
    v_quote.payment_terms_days, v_quote.deposit_percent,
    v_inquiry.shipping_address, v_inquiry.billing_address,
    NOW() + (v_quote.lead_time_weeks || ' weeks')::INTERVAL,
    NOW() + (v_quote.lead_time_weeks || ' weeks')::INTERVAL,
    v_inquiry.notes, v_inquiry.internal_notes
  FROM inquiries v_inquiry
  WHERE v_inquiry.id = v_quote.inquiry_id
  RETURNING id INTO v_order_id;
  
  -- Copy quote_items → order_items
  INSERT INTO order_items (order_id, quote_item_id, product_id, variant_id, quantity, configuration, unit_price_usd, line_total_usd)
  SELECT v_order_id, qi.id, qi.product_id, qi.variant_id, qi.quantity, qi.configuration, qi.unit_price_usd, qi.line_total_usd
  FROM quote_items qi WHERE qi.quote_id = p_quote_id;
  
  -- Convert reservations
  UPDATE stock_reservations SET status = 'converted', converted_at = NOW()
  WHERE id IN (SELECT reservation_id FROM quote_items WHERE quote_id = p_quote_id);
  
  -- Update quote status
  UPDATE quotes SET status = 'accepted', accepted_at = NOW() WHERE id = p_quote_id;
  
  -- Update inquiry status
  UPDATE inquiries SET status = 'quoted' WHERE id = v_quote.inquiry_id;
  
  RETURN v_order_id;
END;
$$;

-- Sequence for order_number
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;

-- ============================================================================
-- FUNCTION: Release Expired Reservations (idempotent, cron-safe)
-- ============================================================================
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_released INT := 0;
  v_reservation RECORD;
BEGIN
  FOR v_reservation IN
    SELECT sr.id, sr.quote_id FROM stock_reservations sr
    WHERE sr.status = 'active' AND sr.expires_at < NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Idempotency: skip if already logged
    INSERT INTO stock_reservation_release_log (reservation_id, released_by)
    VALUES (v_reservation.id, 'cron')
    ON CONFLICT (reservation_id) DO NOTHING;
    
    IF FOUND THEN
      -- Release stock
      UPDATE stock_reservations SET status = 'released', released_at = NOW(), released_reason = 'quote_expired'
      WHERE id = v_reservation.id;
      
      -- Update quote status if still pending
      UPDATE quotes SET status = 'expired' WHERE id = v_reservation.quote_id AND status IN ('sent','viewed','negotiating');
      
      v_released := v_released + 1;
    END IF;
  END LOOP;
  
  RETURN v_released;
END;
$$;

-- ============================================================================
-- FUNCTION: Validate Inquiry Item Configuration
-- Called on insert/update to inquiry_items
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_inquiry_item_config()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_schema JSONB;
  v_valid BOOLEAN;
  v_errors TEXT;
BEGIN
  -- Get active schema for product
  SELECT schema INTO v_schema
  FROM product_configuration_schemas
  WHERE product_id = NEW.product_id AND is_active = true
  ORDER BY version DESC LIMIT 1;
  
  IF v_schema IS NULL THEN
    RETURN NEW;  -- No schema = no validation
  END IF;
  
  -- Validate using JSON Schema (requires postgresql-jsonschema extension or custom)
  -- For now, basic required field check:
  IF v_schema ? 'required' THEN
    FOR v_errors IN SELECT jsonb_array_elements_text(v_schema->'required') AS field LOOP
      IF NOT (NEW.configuration ? v_errors.field) THEN
        RAISE EXCEPTION 'Missing required configuration field: %', v_errors.field;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_inquiry_item_config
BEFORE INSERT OR UPDATE ON inquiry_items
FOR EACH ROW EXECUTE FUNCTION validate_inquiry_item_config();

-- ============================================================================
-- DOWNGRADE (for rollback)
-- Run in reverse order due to FKs
-- ============================================================================
-- DROP TRIGGER trigger_validate_inquiry_item_config ON inquiry_items;
-- DROP FUNCTION validate_inquiry_item_config();
-- DROP FUNCTION release_expired_reservations();
-- DROP FUNCTION accept_quote(UUID, UUID);
-- DROP SEQUENCE IF EXISTS orders_order_number_seq;
-- DROP TABLE IF EXISTS stock_reservation_release_log;
-- DROP TABLE IF EXISTS pricing_rule_snapshots;
-- DROP TABLE IF EXISTS product_configuration_schemas;
-- DROP TABLE IF EXISTS negotiation_threads;
-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS stock_reservations;
-- DROP TABLE IF EXISTS quote_versions;
-- DROP TABLE IF EXISTS quote_items;
-- DROP TABLE IF EXISTS quotes;
-- DROP TABLE IF EXISTS inquiry_items;
-- DROP TABLE IF EXISTS inquiries;