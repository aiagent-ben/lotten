-- Promotions Engine
-- This table stores promotional campaigns with flexible conditions and actions

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
  --   "min_order_value": 500,           -- Minimum order value in base currency (USD)
  --   "max_order_value": 5000,          -- Maximum order value (optional)
  --   "collections": ["uuid1", "uuid2"], -- Specific collection IDs
  --   "products": ["uuid1", "uuid2"],    -- Specific product IDs
  --   "product_variants": ["uuid1"],     -- Specific variant IDs
  --   "categories": ["category1"],       -- Product categories
  --   "customer_segments": ["vip", "new"], -- Customer segments
  --   "customer_tiers": ["gold", "platinum"], -- Customer tiers
  --   "first_order_only": false,         -- First order only
  --   "specific_customers": ["uuid1"],   -- Specific customer IDs
  --   "excluded_products": ["uuid1"],    -- Excluded product IDs
  --   "excluded_collections": ["uuid1"], -- Excluded collection IDs
  --   "min_quantity": 1,                 -- Minimum quantity per item
  --   "max_uses_per_order": 1            -- Max times promo can apply per order
  -- }
  
  -- Actions (JSONB for flexibility)
  actions JSONB NOT NULL DEFAULT '{}',
  -- Actions structure:
  -- {
  --   "type": "percentage_off",           -- Action type
  --   "value": 20,                        -- Percentage (for percentage_off) or amount (for fixed_off)
  --   "max_discount": 200,                -- Maximum discount cap (for percentage_off)
  --   "currency": "USD",                  -- Currency for fixed amounts
  --   "free_product_id": "uuid",          -- Product ID for free product action
  --   "free_product_quantity": 1,         -- Quantity of free product
  --   "buy_quantity": 2,                  -- Buy X (for buy_x_get_y)
  --   "get_quantity": 1,                  -- Get Y (for buy_x_get_y)
  --   "get_discount_type": "percentage",  -- "percentage" | "fixed" | "free"
  --   "get_discount_value": 100,          -- 100% = free, 50% = half off
  --   "free_shipping": true,              -- For free_shipping action
  --   "bundle_products": ["uuid1", "uuid2"], -- Products in bundle
  --   "bundle_discount_type": "percentage", -- "percentage" | "fixed"
  --   "bundle_discount_value": 15,        -- Discount value
  --   "apply_to": "order" | "line_items" | "shipping" -- Where discount applies
  -- }
  
  -- Metadata
  created_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_promotions_status ON promotions(status) WHERE status = 'active';
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_promotions_dates ON promotions(valid_from, valid_until);
CREATE INDEX idx_promotions_is_active ON promotions(is_active) WHERE is_active = true;
CREATE INDEX idx_promotions_slug ON promotions(slug);

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON promotions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Promotion usage tracking
CREATE TABLE promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_promotion_usages_promotion_id ON promotion_usages(promotion_id);
CREATE INDEX idx_promotion_usages_customer_id ON promotion_usages(customer_id);
CREATE INDEX idx_promotion_usages_order_id ON promotion_usages(order_id);
CREATE INDEX idx_promotion_usages_created_at ON promotion_usages(created_at);

-- Trigger for promotion_usages updated_at (though we may not need updated_at here)
CREATE TRIGGER update_promotion_usages_updated_at 
  BEFORE UPDATE ON promotion_usages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Customer segments (for promotion targeting)
CREATE TABLE customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  auto_assign_rules JSONB, -- Rules for automatic assignment
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_segments_slug ON customer_segments(slug);
CREATE INDEX idx_customer_segments_is_active ON customer_segments(is_active) WHERE is_active = true;

CREATE TRIGGER update_customer_segments_updated_at 
  BEFORE UPDATE ON customer_segments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Customer segment memberships
CREATE TABLE customer_segment_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE (customer_id, segment_id)
);

CREATE INDEX idx_customer_segment_memberships_customer ON customer_segment_memberships(customer_id);
CREATE INDEX idx_customer_segment_memberships_segment ON customer_segment_memberships(segment_id);

-- RLS Policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;

-- Promotions: admin full access, public can read active promotions
CREATE POLICY "Admin full access to promotions" ON promotions
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

-- For service role (admin API), allow all
CREATE POLICY "Service role full access to promotions" ON promotions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Public can view active promotions (for frontend validation)
CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

-- Promotion usages: admin full access
CREATE POLICY "Admin full access to promotion_usages" ON promotion_usages
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

CREATE POLICY "Service role full access to promotion_usages" ON promotion_usages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Customer segments: admin full access
CREATE POLICY "Admin full access to customer_segments" ON customer_segments
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

CREATE POLICY "Service role full access to customer_segments" ON customer_segments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Customer segment memberships: admin full access
CREATE POLICY "Admin full access to customer_segment_memberships" ON customer_segment_memberships
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

CREATE POLICY "Service role full access to customer_segment_memberships" ON customer_segment_memberships
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to validate promotion applicability
CREATE OR REPLACE FUNCTION validate_promotion(
  p_promotion_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_cart_items JSONB,
  p_cart_total DECIMAL(12,2),
  p_currency TEXT DEFAULT 'USD'
) RETURNS TABLE (
  valid BOOLEAN,
  discount_amount DECIMAL(12,2),
  discount_details JSONB,
  error_message TEXT
) AS $$
DECLARE
  promo RECORD;
  condition_check BOOLEAN;
  action_result JSONB;
BEGIN
  -- Fetch promotion
  SELECT * INTO promo FROM promotions WHERE id = p_promotion_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion not found';
    RETURN;
  END IF;
  
  -- Check status and dates
  IF promo.status != 'active' OR promo.is_active = false THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion is not active';
    RETURN;
  END IF;
  
  IF promo.valid_from > now() THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion has not started yet';
    RETURN;
  END IF;
  
  IF promo.valid_until IS NOT NULL AND promo.valid_until < now() THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion has expired';
    RETURN;
  END IF;
  
  -- Check usage limits
  IF promo.usage_limit IS NOT NULL AND promo.used_count >= promo.usage_limit THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion usage limit reached';
    RETURN;
  END IF;
  
  -- Check per-customer usage
  IF p_customer_id IS NOT NULL AND promo.usage_limit_per_customer IS NOT NULL THEN
    DECLARE customer_usage INT;
    SELECT COUNT(*) INTO customer_usage 
    FROM promotion_usages 
    WHERE promotion_id = p_promotion_id AND customer_id = p_customer_id;
    
    IF customer_usage >= promo.usage_limit_per_customer THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer usage limit reached';
      RETURN;
    END IF;
  END IF;
  
  -- Check conditions (simplified - in production, use a more robust evaluator)
  condition_check := true;
  
  -- Min order value
  IF promo.conditions->>'min_order_value' IS NOT NULL THEN
    IF p_cart_total < (promo.conditions->>'min_order_value')::DECIMAL THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Order value below minimum';
      RETURN;
    END IF;
  END IF;
  
  -- Max order value
  IF promo.conditions->>'max_order_value' IS NOT NULL THEN
    IF p_cart_total > (promo.conditions->>'max_order_value')::DECIMAL THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Order value exceeds maximum';
      RETURN;
    END IF;
  END IF;
  
  -- First order only
  IF (promo.conditions->>'first_order_only')::BOOLEAN = true AND p_customer_id IS NOT NULL THEN
    DECLARE order_count INT;
    SELECT COUNT(*) INTO order_count FROM orders WHERE customer_id = p_customer_id;
    IF order_count > 0 THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion for first order only';
      RETURN;
    END IF;
  END IF;
  
  -- Collections check
  IF promo.conditions->'collections' IS NOT NULL AND jsonb_array_length(promo.conditions->'collections') > 0 THEN
    DECLARE has_collection BOOLEAN := false;
    DECLARE item JSONB;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      DECLARE product_collection UUID;
      SELECT collection_id INTO product_collection FROM products WHERE id = (item->>'product_id')::UUID;
      IF product_collection = ANY((promo.conditions->'collections')::UUID[]) THEN
        has_collection := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT has_collection THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'No eligible products from required collections';
      RETURN;
    END IF;
  END IF;
  
  -- Products check
  IF promo.conditions->'products' IS NOT NULL AND jsonb_array_length(promo.conditions->'products') > 0 THEN
    DECLARE has_product BOOLEAN := false;
    DECLARE item JSONB;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      IF (item->>'product_id')::UUID = ANY((promo.conditions->'products')::UUID[]) THEN
        has_product := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT has_product THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'No eligible products in cart';
      RETURN;
    END IF;
  END IF;
  
  -- Customer segments check
  IF promo.conditions->'customer_segments' IS NOT NULL AND jsonb_array_length(promo.conditions->'customer_segments') > 0 AND p_customer_id IS NOT NULL THEN
    DECLARE has_segment BOOLEAN := false;
    SELECT EXISTS (
      SELECT 1 FROM customer_segment_memberships csm
      JOIN customer_segments cs ON csm.segment_id = cs.id
      WHERE csm.customer_id = p_customer_id
      AND cs.slug = ANY((promo.conditions->'customer_segments')::TEXT[])
    ) INTO has_segment;
    IF NOT has_segment THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer not in eligible segment';
      RETURN;
    END IF;
  END IF;
  
  -- Specific customers check
  IF promo.conditions->'specific_customers' IS NOT NULL AND jsonb_array_length(promo.conditions->'specific_customers') > 0 THEN
    IF p_customer_id IS NULL OR NOT (p_customer_id = ANY((promo.conditions->'specific_customers')::UUID[])) THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer not eligible';
      RETURN;
    END IF;
  END IF;
  
  -- Excluded products check
  IF promo.conditions->'excluded_products' IS NOT NULL AND jsonb_array_length(promo.conditions->'excluded_products') > 0 THEN
    DECLARE has_excluded BOOLEAN := false;
    DECLARE item JSONB;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      IF (item->>'product_id')::UUID = ANY((promo.conditions->'excluded_products')::UUID[]) THEN
        has_excluded := true;
        EXIT;
      END IF;
    END LOOP;
    IF has_excluded THEN
      condition_check := false;
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Cart contains excluded products';
      RETURN;
    END IF;
  END IF;
  
  -- Calculate discount based on action type
  DECLARE discount_amount DECIMAL(12,2) := 0;
  DECLARE action_type TEXT := promo.actions->>'type';
  DECLARE action_value DECIMAL(12,2) := (promo.actions->>'value')::DECIMAL;
  
  CASE action_type
    WHEN 'percentage_off' THEN
      discount_amount := p_cart_total * action_value / 100;
      IF promo.actions->>'max_discount' IS NOT NULL THEN
        discount_amount := LEAST(discount_amount, (promo.actions->>'max_discount')::DECIMAL);
      END IF;
    
    WHEN 'fixed_off' THEN
      discount_amount := action_value;
    
    WHEN 'free_shipping' THEN
      -- Shipping discount handled at order level
      discount_amount := 0;
    
    WHEN 'free_product' THEN
      -- Free product discount handled at line item level
      discount_amount := 0;
    
    WHEN 'buy_x_get_y' THEN
      -- Complex logic for BxGy handled separately
      discount_amount := 0;
    
    WHEN 'bundle_discount' THEN
      -- Bundle discount handled separately
      discount_amount := 0;
  END CASE;
  
  RETURN QUERY SELECT true, discount_amount, promo.actions, NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record promotion usage
CREATE OR REPLACE FUNCTION record_promotion_usage(
  p_promotion_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_discount_amount DECIMAL(12,2),
  p_currency TEXT DEFAULT 'USD',
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO promotion_usages (promotion_id, customer_id, order_id, discount_amount, currency, metadata)
  VALUES (p_promotion_id, p_customer_id, p_order_id, p_discount_amount, p_currency, p_metadata);
  
  -- Update usage count
  UPDATE promotions 
  SET used_count = used_count + 1 
  WHERE id = p_promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;