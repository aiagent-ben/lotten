-- Promotions Engine Migration
-- Run this after 001_initial_schema.sql

-- Promotions table
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Promotion type
  type TEXT NOT NULL CHECK (type IN (
    'percentage_discount',   -- Percentage off (e.g., 20% off)
    'fixed_discount',        -- Fixed amount off (e.g., MYR 50 off)
    'buy_x_get_y',           -- Buy X get Y (free or discounted)
    'free_shipping',         -- Free shipping
    'bundle_discount'        -- Bundle discount (buy specific combination)
  )),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived')),
  is_active BOOLEAN DEFAULT true,
  
  -- Dates
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Priority for stacking (higher priority applies first, lower can stack if allowed)
  priority INT DEFAULT 100,
  can_stack BOOLEAN DEFAULT false,
  
  -- Usage limits
  usage_limit INT, -- total uses across all customers
  used_count INT DEFAULT 0,
  usage_limit_per_customer INT DEFAULT 1,
  
  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Conditions structure:
  -- {
  --   "min_order_value": 500,              -- Minimum order value in base currency (USD)
  --   "max_order_value": 5000,             -- Maximum order value (optional)
  --   "collections": ["uuid1", "uuid2"],   -- Specific collection IDs
  --   "products": ["uuid1", "uuid2"],      -- Specific product IDs
  --   "product_variants": ["uuid1"],       -- Specific variant IDs
  --   "categories": ["category1"],         -- Product categories
  --   "customer_segments": ["vip", "new"], -- Customer segments
  --   "customer_tiers": ["gold", "platinum"], -- Customer tiers
  --   "first_order_only": false,           -- First order only
  --   "specific_customers": ["uuid1"],     -- Specific customer IDs
  --   "excluded_products": ["uuid1"],      -- Excluded product IDs
  --   "excluded_collections": ["uuid1"],   -- Excluded collection IDs
  --   "min_quantity": 1,                   -- Minimum quantity per item
  --   "max_uses_per_order": 1              -- Max times promo can apply per order
  -- }
  
  -- Actions (JSONB for flexibility)
  actions JSONB NOT NULL DEFAULT '{}',
  -- Actions structure:
  -- {
  --   "type": "percentage_off",              -- Action type
  --   "value": 20,                           -- Percentage (for percentage_off) or amount (for fixed_off)
  --   "max_discount": 200,                   -- Maximum discount cap (for percentage_off)
  --   "currency": "USD",                     -- Currency for fixed amounts
  --   "free_product_id": "uuid",             -- Product ID for free product action
  --   "free_product_quantity": 1,            -- Quantity of free product
  --   "buy_quantity": 2,                     -- Buy X (for buy_x_get_y)
  --   "get_quantity": 1,                     -- Get Y (for buy_x_get_y)
  --   "get_discount_type": "percentage",     -- "percentage" | "fixed" | "free"
  --   "get_discount_value": 100,             -- 100% = free, 50% = half off
  --   "free_shipping": true,                 -- For free_shipping action
  --   "bundle_products": ["uuid1", "uuid2"], -- Products in bundle
  --   "bundle_discount_type": "percentage",  -- "percentage" | "fixed"
  --   "bundle_discount_value": 15            -- Discount value for bundle
  -- }
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promotion usages tracking (per customer)
CREATE TABLE promotion_usages (
  id BIGSERIAL PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promotion_id, customer_id)
);

-- Indexes for promotions
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_is_active ON promotions(is_active) WHERE is_active = true;
CREATE INDEX idx_promotions_valid_from ON promotions(valid_from);
CREATE INDEX idx_promotions_valid_until ON promotions(valid_until);
CREATE INDEX idx_promotions_slug ON promotions(slug);
CREATE INDEX idx_promotions_priority ON promotions(priority);

-- Indexes for promotion_usages
CREATE INDEX idx_promotion_usages_promotion_id ON promotion_usages(promotion_id);
CREATE INDEX idx_promotion_usages_customer_id ON promotion_usages(customer_id);
CREATE INDEX idx_promotion_usages_order_id ON promotion_usages(order_id);

-- Updated_at trigger for promotions
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;

-- Allow admin/service role full access
CREATE POLICY "Service role full access to promotions" ON promotions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to promotion_usages" ON promotion_usages FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read active promotions
CREATE POLICY "Authenticated users can read active promotions" ON promotions FOR SELECT 
  USING (auth.role() = 'authenticated' AND is_active = true AND status = 'active' AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

-- Allow authenticated users to read their own promotion usages
CREATE POLICY "Users can read own promotion usages" ON promotion_usages FOR SELECT 
  USING (auth.role() = 'authenticated' AND customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));