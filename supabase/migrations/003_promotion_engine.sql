-- Promotion Engine
-- Rule-based promotions: coupons, bundles, flash sales, BOGO, first-order discount, volume discounts

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'bogo', 'bundle', 'volume', 'first_order', 'flash_sale', 'free_shipping')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'expired', 'paused')),
  
  -- Discount configuration
  discount_percentage DECIMAL(5,2),  -- e.g., 15.00 for 15%
  discount_amount DECIMAL(10,2),     -- e.g., 50.00 for $50 off
  max_discount_amount DECIMAL(10,2), -- cap on discount
  
  -- BOGO configuration
  bogo_buy_quantity INT DEFAULT 1,
  bogo_get_quantity INT DEFAULT 1,
  bogo_get_discount_percentage DECIMAL(5,2) DEFAULT 100, -- 100 = free, 50 = 50% off
  
  -- Bundle configuration
  bundle_products JSONB, -- array of product_ids with quantities
  bundle_price DECIMAL(10,2),
  
  -- Volume discount tiers
  volume_tiers JSONB, -- [{"min_qty": 3, "discount_pct": 10}, {"min_qty": 5, "discount_pct": 15}]
  
  -- First order discount
  first_order_only BOOLEAN DEFAULT false,
  
  -- Flash sale
  flash_sale_start TIMESTAMPTZ,
  flash_sale_end TIMESTAMPTZ,
  flash_sale_max_uses INT,
  flash_sale_used INT DEFAULT 0,
  
  -- Free shipping
  free_shipping_threshold DECIMAL(10,2),
  
  -- Conditions
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  uses_count INT DEFAULT 0,
  uses_per_customer INT DEFAULT 1,
  
  -- Targeting
  applicable_product_ids UUID[],
  applicable_collection_ids UUID[],
  applicable_customer_tiers TEXT[], -- loyalty tiers
  excluded_product_ids UUID[],
  
  -- Scheduling
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  
  -- Priority (higher = applied first)
  priority INT DEFAULT 0,
  
  -- Stacking
  stackable BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promotion usage tracking
CREATE TABLE promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_starts_at ON promotions(starts_at);
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);
CREATE INDEX idx_promotions_active ON promotions(starts_at, ends_at, status) WHERE status = 'active';
CREATE INDEX idx_promotion_usages_promotion_id ON promotion_usages(promotion_id);
CREATE INDEX idx_promotion_usages_customer_id ON promotion_usages(customer_id);
CREATE INDEX idx_promotion_usages_order_id ON promotion_usages(order_id);

-- Updated_at trigger
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();