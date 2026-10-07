-- ============================================================================
-- Lotten Production Supabase Schema Deployment
-- Applied to production (http://supabase.2share.tech)
-- Idempotent, safe for re-running.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & SEQUENCES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;

-- ----------------------------------------------------------------------------
-- 2. PRODUCTS: ADD CATEGORIES COLUMN & GIN INDEX
-- ----------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories TEXT[];
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN (categories);

-- ----------------------------------------------------------------------------
-- 3. COLLECTIONS: GHOST COLLECTIONS CLEANUP
-- ----------------------------------------------------------------------------
UPDATE collections 
SET is_active = false 
WHERE slug IN ('unknown', 'nuhoom', 'nesthouz', 'nestnordic', 'fyndfurniture', 'luooma');

UPDATE collections 
SET name = 'Talbot', 
    slug = 'talbot', 
    description = 'Talbot collection by B2B Furniture Supply' 
WHERE slug = 'shoe-cabinet';

-- ----------------------------------------------------------------------------
-- 4. CONTENT MANAGEMENT SCHEMA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('blog', 'guide', 'lookbook')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_mdx TEXT NOT NULL,
  excerpt TEXT,
  type TEXT NOT NULL CHECK (type IN ('blog', 'guide', 'lookbook', 'page')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured_image_url TEXT,
  featured_image_alt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_og_image TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  room_type TEXT,
  style_tags TEXT[] DEFAULT '{}',
  featured_products TEXT[] DEFAULT '{}',
  hotspots JSONB DEFAULT '[]',
  read_time_minutes INT,
  view_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  template TEXT DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS content_page_categories (
  content_page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  content_category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_page_id, content_category_id)
);

CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_page_tags (
  content_page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  content_tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_page_id, content_tag_id)
);

CREATE TABLE IF NOT EXISTS content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_mdx TEXT NOT NULL,
  content_html TEXT,
  featured_image_url TEXT,
  featured_image_alt TEXT,
  author_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  tags TEXT[],
  category TEXT,
  read_time_minutes INT,
  view_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_lookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  intro_mdx TEXT,
  intro_html TEXT,
  room_type TEXT,
  style_tags TEXT[],
  featured_products UUID[],
  hotspots JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_type ON content_pages(type);
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);
CREATE INDEX IF NOT EXISTS idx_content_pages_published_at ON content_pages(published_at);
CREATE INDEX IF NOT EXISTS idx_content_pages_type_status ON content_pages(type, status);
CREATE INDEX IF NOT EXISTS idx_content_pages_scheduled_at ON content_pages(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_pages_category ON content_pages(category);
CREATE INDEX IF NOT EXISTS idx_content_pages_tags ON content_pages USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON content_categories(slug);
CREATE INDEX IF NOT EXISTS idx_content_categories_type ON content_categories(type);

CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_category ON content_posts(category);
CREATE INDEX IF NOT EXISTS idx_content_posts_published_at ON content_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_content_posts_slug ON content_posts(slug);
CREATE INDEX IF NOT EXISTS idx_content_lookbooks_status ON content_lookbooks(status);
CREATE INDEX IF NOT EXISTS idx_content_lookbooks_room_type ON content_lookbooks(room_type);
CREATE INDEX IF NOT EXISTS idx_content_lookbooks_slug ON content_lookbooks(slug);

DROP TRIGGER IF EXISTS update_content_pages_updated_at ON content_pages;
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_categories_updated_at ON content_categories;
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_posts_updated_at ON content_posts;
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_lookbooks_updated_at ON content_lookbooks;
CREATE TRIGGER update_content_lookbooks_updated_at BEFORE UPDATE ON content_lookbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_content_view_count(content_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_pages
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. PROMOTIONS SCHEMA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'percentage_discount',
    'fixed_discount',
    'buy_x_get_y',
    'free_shipping',
    'bundle_discount'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived')),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  priority INT DEFAULT 100,
  can_stack BOOLEAN DEFAULT false,
  usage_limit INT,
  used_count INT DEFAULT 0,
  usage_limit_per_customer INT DEFAULT 1,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_slug ON promotions(slug);

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at 
  BEFORE UPDATE ON promotions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion_id ON promotion_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer_id ON promotion_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_order_id ON promotion_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_created_at ON promotion_usages(created_at);

DROP TRIGGER IF EXISTS update_promotion_usages_updated_at ON promotion_usages;
CREATE TRIGGER update_promotion_usages_updated_at 
  BEFORE UPDATE ON promotion_usages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  auto_assign_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_slug ON customer_segments(slug);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON customer_segments;
CREATE TRIGGER update_customer_segments_updated_at 
  BEFORE UPDATE ON customer_segments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS customer_segment_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE (customer_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer ON customer_segment_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment ON customer_segment_memberships(segment_id);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to promotions" ON promotions;
CREATE POLICY "Admin full access to promotions" ON promotions
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Service role full access to promotions" ON promotions;
CREATE POLICY "Service role full access to promotions" ON promotions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

DROP POLICY IF EXISTS "Admin full access to promotion_usages" ON promotion_usages;
CREATE POLICY "Admin full access to promotion_usages" ON promotion_usages
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Service role full access to promotion_usages" ON promotion_usages;
CREATE POLICY "Service role full access to promotion_usages" ON promotion_usages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access to customer_segments" ON customer_segments;
CREATE POLICY "Admin full access to customer_segments" ON customer_segments
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Service role full access to customer_segments" ON customer_segments;
CREATE POLICY "Service role full access to customer_segments" ON customer_segments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access to customer_segment_memberships" ON customer_segment_memberships;
CREATE POLICY "Admin full access to customer_segment_memberships" ON customer_segment_memberships
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())))
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Service role full access to customer_segment_memberships" ON customer_segment_memberships;
CREATE POLICY "Service role full access to customer_segment_memberships" ON customer_segment_memberships
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION validate_promotion(
  p_promotion_id UUID,
  p_cart_items JSONB,
  p_cart_total DECIMAL(12,2),
  p_customer_id UUID DEFAULT NULL,
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
  customer_usage INT;
  order_count INT;
  has_collection BOOLEAN;
  has_product BOOLEAN;
  has_segment BOOLEAN;
  has_excluded BOOLEAN;
  item JSONB;
  product_collection UUID;
  computed_discount DECIMAL(12,2) := 0;
  action_type TEXT;
  action_value DECIMAL(12,2);
BEGIN
  SELECT * INTO promo FROM promotions WHERE id = p_promotion_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion not found';
    RETURN;
  END IF;
  
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
  
  IF promo.usage_limit IS NOT NULL AND promo.used_count >= promo.usage_limit THEN
    RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion usage limit reached';
    RETURN;
  END IF;
  
  IF p_customer_id IS NOT NULL AND promo.usage_limit_per_customer IS NOT NULL THEN
    SELECT COUNT(*) INTO customer_usage
    FROM promotion_usages 
    WHERE promotion_id = p_promotion_id AND customer_id = p_customer_id;
    
    IF customer_usage >= promo.usage_limit_per_customer THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer usage limit reached';
      RETURN;
    END IF;
  END IF;
  
  condition_check := true;
  
  IF promo.conditions->>'min_order_value' IS NOT NULL THEN
    IF p_cart_total < (promo.conditions->>'min_order_value')::DECIMAL THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Order value below minimum';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->>'max_order_value' IS NOT NULL THEN
    IF p_cart_total > (promo.conditions->>'max_order_value')::DECIMAL THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Order value exceeds maximum';
      RETURN;
    END IF;
  END IF;
  
  IF (promo.conditions->>'first_order_only')::BOOLEAN = true AND p_customer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO order_count FROM orders WHERE customer_id = p_customer_id;
    IF order_count > 0 THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Promotion for first order only';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->'collections' IS NOT NULL AND jsonb_array_length(promo.conditions->'collections') > 0 THEN
    has_collection := false;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      SELECT collection_id INTO product_collection FROM products WHERE id = (item->>'product_id')::UUID;
      IF product_collection = ANY((promo.conditions->'collections')::UUID[]) THEN
        has_collection := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT has_collection THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'No eligible products from required collections';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->'products' IS NOT NULL AND jsonb_array_length(promo.conditions->'products') > 0 THEN
    has_product := false;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      IF (item->>'product_id')::UUID = ANY((promo.conditions->'products')::UUID[]) THEN
        has_product := true;
        EXIT;
      END IF;
    END LOOP;
    IF NOT has_product THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'No eligible products in cart';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->'customer_segments' IS NOT NULL AND jsonb_array_length(promo.conditions->'customer_segments') > 0 AND p_customer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM customer_segment_memberships csm
      JOIN customer_segments cs ON csm.segment_id = cs.id
      WHERE csm.customer_id = p_customer_id
      AND cs.slug = ANY((promo.conditions->'customer_segments')::TEXT[])
    ) INTO has_segment;
    IF NOT has_segment THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer not in eligible segment';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->'specific_customers' IS NOT NULL AND jsonb_array_length(promo.conditions->'specific_customers') > 0 THEN
    IF p_customer_id IS NULL OR NOT (p_customer_id = ANY((promo.conditions->'specific_customers')::UUID[])) THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Customer not eligible';
      RETURN;
    END IF;
  END IF;
  
  IF promo.conditions->'excluded_products' IS NOT NULL AND jsonb_array_length(promo.conditions->'excluded_products') > 0 THEN
    has_excluded := false;
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      IF (item->>'product_id')::UUID = ANY((promo.conditions->'excluded_products')::UUID[]) THEN
        has_excluded := true;
        EXIT;
      END IF;
    END LOOP;
    IF has_excluded THEN
      RETURN QUERY SELECT false, 0, '{}'::JSONB, 'Cart contains excluded products';
      RETURN;
    END IF;
  END IF;
  
  action_type := promo.actions->>'type';
  action_value := (promo.actions->>'value')::DECIMAL;

  CASE action_type
    WHEN 'percentage_off' THEN
      computed_discount := p_cart_total * action_value / 100;
      IF promo.actions->>'max_discount' IS NOT NULL THEN
        computed_discount := LEAST(computed_discount, (promo.actions->>'max_discount')::DECIMAL);
      END IF;
    WHEN 'fixed_off' THEN
      computed_discount := action_value;
    ELSE
      computed_discount := 0;
  END CASE;

  RETURN QUERY SELECT true, computed_discount, promo.actions, NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_promotion_usage(
  p_promotion_id UUID,
  p_discount_amount DECIMAL(12,2),
  p_customer_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO promotion_usages (promotion_id, customer_id, order_id, discount_amount, currency, metadata)
  VALUES (p_promotion_id, p_customer_id, p_order_id, p_discount_amount, p_currency, p_metadata);
  
  UPDATE promotions 
  SET used_count = used_count + 1 
  WHERE id = p_promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. INQUIRY & QUOTE SYSTEM SCHEMA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'qualified', 'quoted', 'on_hold', 'cancelled', 'abandoned'
  )),
  source_channel TEXT DEFAULT 'web' CHECK (source_channel IN (
    'web', 'showroom', 'phone', 'email', 'referral'
  )),
  assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  internal_notes TEXT,
  submitted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_customer_id ON inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_session_id ON inquiries(session_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_rep ON inquiries(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_expires_at ON inquiries(expires_at) WHERE status IN ('draft','submitted','qualified');
CREATE INDEX IF NOT EXISTS idx_inquiries_session_status ON inquiries(session_id, status) WHERE status = 'draft';

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own inquiries" ON inquiries;
CREATE POLICY "Customer own inquiries" ON inquiries FOR ALL USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Rep assigned inquiries" ON inquiries;
CREATE POLICY "Rep assigned inquiries" ON inquiries FOR ALL USING (
  assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'
);
DROP POLICY IF EXISTS "Admin all inquiries" ON inquiries;
CREATE POLICY "Admin all inquiries" ON inquiries FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Anon insert draft" ON inquiries;
CREATE POLICY "Anon insert draft" ON inquiries FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  configuration JSONB NOT NULL DEFAULT '{}',
  unit_price_usd DECIMAL(12,4),
  line_total_usd DECIMAL(14,4),
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_product_id ON inquiry_items(product_id);

ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own inquiry items" ON inquiry_items;
CREATE POLICY "Customer own inquiry items" ON inquiry_items FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Rep inquiry items" ON inquiry_items;
CREATE POLICY "Rep inquiry items" ON inquiry_items FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin')
);
DROP POLICY IF EXISTS "Admin all inquiry items" ON inquiry_items;
CREATE POLICY "Admin all inquiry items" ON inquiry_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Anon insert draft items" ON inquiry_items;
CREATE POLICY "Anon insert draft items" ON inquiry_items FOR INSERT WITH CHECK (
  inquiry_id IN (SELECT id FROM inquiries WHERE status = 'draft')
);

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE RESTRICT,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired', 'partially_accepted'
  )),
  quote_number TEXT NOT NULL UNIQUE,
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
  lead_time_weeks INT,
  valid_until TIMESTAMPTZ NOT NULL,
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  change_summary TEXT,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  viewed_by_ip INET,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (inquiry_id, version),
  CHECK (valid_until > created_at + INTERVAL '1 day'),
  CHECK (deposit_percent BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_quotes_inquiry_id ON quotes(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until) WHERE status IN ('sent','viewed','negotiating');
CREATE INDEX IF NOT EXISTS idx_quotes_customer_status_valid ON quotes(inquiry_id, status, valid_until) 
  WHERE status IN ('sent','viewed','negotiating');
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own quotes" ON quotes;
CREATE POLICY "Customer own quotes" ON quotes FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Rep quotes" ON quotes;
CREATE POLICY "Rep quotes" ON quotes FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) 
  OR (auth.jwt() ->> 'role') = 'admin'
);
DROP POLICY IF EXISTS "Admin all quotes" ON quotes;
CREATE POLICY "Admin all quotes" ON quotes FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  inquiry_item_id UUID REFERENCES inquiry_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  configuration JSONB NOT NULL,
  unit_price_usd DECIMAL(12,4) NOT NULL,
  line_total_usd DECIMAL(14,4) NOT NULL,
  reservation_id UUID,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_reservation_id ON quote_items(reservation_id);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own quote items" ON quote_items;
CREATE POLICY "Customer own quote items" ON quote_items FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid()))
);
DROP POLICY IF EXISTS "Rep quote items" ON quote_items;
CREATE POLICY "Rep quote items" ON quote_items FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
DROP POLICY IF EXISTS "Admin all quote items" ON quote_items;
CREATE POLICY "Admin all quote items" ON quote_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (quote_id, version)
);

CREATE INDEX IF NOT EXISTS idx_quote_versions_quote_id ON quote_versions(quote_id);

ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rep quote versions" ON quote_versions;
CREATE POLICY "Rep quote versions" ON quote_versions FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
DROP POLICY IF EXISTS "Admin all quote versions" ON quote_versions;
CREATE POLICY "Admin all quote versions" ON quote_versions FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'released', 'converted', 'expired', 'partially_released'
  )),
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  converted_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  released_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (expires_at > reserved_at)
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_quote_id ON stock_reservations(quote_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status_expires ON stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_active ON stock_reservations(product_id, variant_id) WHERE status = 'active';

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rep stock reservations" ON stock_reservations;
CREATE POLICY "Rep stock reservations" ON stock_reservations FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
DROP POLICY IF EXISTS "Admin all stock reservations" ON stock_reservations;
CREATE POLICY "Admin all stock reservations" ON stock_reservations FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

ALTER TABLE quote_items DROP CONSTRAINT IF EXISTS fk_quote_items_reservation;
ALTER TABLE quote_items 
  ADD CONSTRAINT fk_quote_items_reservation 
  FOREIGN KEY (reservation_id) REFERENCES stock_reservations(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 7. ORDERS & ORDER_ITEMS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'confirmed', 'production', 'shipped', 'delivered', 'cancelled', 'on_hold', 'returned'
  )),
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
  deposit_transaction_id UUID,
  payment_gateway_id UUID,
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  delivered_date DATE,
  production_deadline DATE,
  customer_notes TEXT,
  internal_notes TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  production_started_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_production_deadline ON orders(production_deadline) WHERE status IN ('confirmed','production');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own orders" ON orders;
CREATE POLICY "Customer own orders" ON orders FOR ALL USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Rep orders" ON orders;
CREATE POLICY "Rep orders" ON orders FOR ALL USING (
  inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) 
  OR quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()))
  OR (auth.jwt() ->> 'role') = 'admin'
);
DROP POLICY IF EXISTS "Admin all orders" ON orders;
CREATE POLICY "Admin all orders" ON orders FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

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

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_quote_item_id ON order_items(quote_item_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer own order items" ON order_items;
CREATE POLICY "Customer own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Rep order items" ON order_items;
CREATE POLICY "Rep order items" ON order_items FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid()) OR quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid())) OR (auth.jwt() ->> 'role') = 'admin')
);
DROP POLICY IF EXISTS "Admin all order items" ON order_items;
CREATE POLICY "Admin all order items" ON order_items FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS negotiation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_threads_quote_id ON negotiation_threads(quote_id);

ALTER TABLE negotiation_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer negotiation" ON negotiation_threads;
CREATE POLICY "Customer negotiation" ON negotiation_threads FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE customer_id = auth.uid()))
  AND is_internal = false
);
DROP POLICY IF EXISTS "Rep negotiation" ON negotiation_threads;
CREATE POLICY "Rep negotiation" ON negotiation_threads FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
DROP POLICY IF EXISTS "Admin all negotiation" ON negotiation_threads;
CREATE POLICY "Admin all negotiation" ON negotiation_threads FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS product_configuration_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, version)
);

CREATE INDEX IF NOT EXISTS idx_product_config_schemas_product ON product_configuration_schemas(product_id);

ALTER TABLE product_configuration_schemas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active schemas" ON product_configuration_schemas;
CREATE POLICY "Public read active schemas" ON product_configuration_schemas FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin manage schemas" ON product_configuration_schemas;
CREATE POLICY "Admin manage schemas" ON product_configuration_schemas FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS pricing_rule_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_snapshots_quote ON pricing_rule_snapshots(quote_id);

ALTER TABLE pricing_rule_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rep pricing snapshots" ON pricing_rule_snapshots;
CREATE POLICY "Rep pricing snapshots" ON pricing_rule_snapshots FOR SELECT USING (
  quote_id IN (SELECT id FROM quotes WHERE inquiry_id IN (SELECT id FROM inquiries WHERE assigned_rep_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'))
);
DROP POLICY IF EXISTS "Admin all pricing snapshots" ON pricing_rule_snapshots;
CREATE POLICY "Admin all pricing snapshots" ON pricing_rule_snapshots FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS stock_reservation_release_log (
  reservation_id UUID PRIMARY KEY REFERENCES stock_reservations(id) ON DELETE CASCADE,
  released_at TIMESTAMPTZ DEFAULT now(),
  released_by TEXT DEFAULT 'cron'
);

-- TRIGGERS: updated_at
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inquiry_items_updated_at ON inquiry_items;
CREATE TRIGGER update_inquiry_items_updated_at BEFORE UPDATE ON inquiry_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNCTIONS
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
  
  SELECT * INTO v_inquiry FROM inquiries WHERE id = v_quote.inquiry_id;
  IF v_inquiry.customer_id IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Customer % not authorized for quote %', p_customer_id, p_quote_id;
  END IF;
  
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
  FOR UPDATE OF sr;
  
  IF v_reservation_count != v_active_reservation_count THEN
    RAISE EXCEPTION 'Some reservations expired or released: % of % active', v_active_reservation_count, v_reservation_count;
  END IF;
  
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
  
  INSERT INTO order_items (order_id, quote_item_id, product_id, variant_id, quantity, configuration, unit_price_usd, line_total_usd)
  SELECT v_order_id, qi.id, qi.product_id, qi.variant_id, qi.quantity, qi.configuration, qi.unit_price_usd, qi.line_total_usd
  FROM quote_items qi WHERE qi.quote_id = p_quote_id;
  
  UPDATE stock_reservations SET status = 'converted', converted_at = NOW()
  WHERE id IN (SELECT reservation_id FROM quote_items WHERE quote_id = p_quote_id);
  
  UPDATE quotes SET status = 'accepted', accepted_at = NOW() WHERE id = p_quote_id;
  UPDATE inquiries SET status = 'quoted' WHERE id = v_quote.inquiry_id;
  
  RETURN v_order_id;
END;
$$;

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
    INSERT INTO stock_reservation_release_log (reservation_id, released_by)
    VALUES (v_reservation.id, 'cron')
    ON CONFLICT (reservation_id) DO NOTHING;
    
    IF FOUND THEN
      UPDATE stock_reservations SET status = 'released', released_at = NOW(), released_reason = 'quote_expired'
      WHERE id = v_reservation.id;
      
      UPDATE quotes SET status = 'expired' WHERE id = v_reservation.quote_id AND status IN ('sent','viewed','negotiating');
      
      v_released := v_released + 1;
    END IF;
  END LOOP;
  
  RETURN v_released;
END;
$$;

CREATE OR REPLACE FUNCTION validate_inquiry_item_config()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_schema JSONB;
  v_valid BOOLEAN;
  v_errors TEXT;
BEGIN
  SELECT schema INTO v_schema
  FROM product_configuration_schemas
  WHERE product_id = NEW.product_id AND is_active = true
  ORDER BY version DESC LIMIT 1;
  
  IF v_schema IS NULL THEN
    RETURN NEW;
  END IF;
  
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

DROP TRIGGER IF EXISTS trigger_validate_inquiry_item_config ON inquiry_items;
CREATE TRIGGER trigger_validate_inquiry_item_config
BEFORE INSERT OR UPDATE ON inquiry_items
FOR EACH ROW EXECUTE FUNCTION validate_inquiry_item_config();

-- ----------------------------------------------------------------------------
-- 8. CORE TABLES RLS POLICIES (20261008000000_enable_rls_core_tables.sql)
-- ----------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own customer profile" ON customers;
CREATE POLICY "Users can view own customer profile"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own customer profile" ON customers;
CREATE POLICY "Users can update own customer profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT o.id FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Anyone can view active discount codes" ON discount_codes;
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 9. SCHEMA MIGRATIONS AUDIT LOG & POSTGREST CACHE RELOAD
-- ----------------------------------------------------------------------------
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('002_content_management', 'content_management'),
  ('002_promotions_schema', 'promotions_schema'),
  ('004_content_management', 'content_posts_lookbooks'),
  ('005_add_categories_to_products', 'add_categories_to_products'),
  ('006_inquiry_quote_system', 'inquiry_quote_system'),
  ('20260919163000', 'cleanup_ghost_collections'),
  ('20260919173000', 'enhance_content_pages'),
  ('20261008000000', 'enable_rls_core_tables')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
