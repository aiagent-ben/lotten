-- Core tables
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
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
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  color_palette JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_no TEXT NOT NULL UNIQUE,
  collection_id UUID REFERENCES collections(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  width_mm INT,
  depth_mm INT,
  height_mm INT,
  weight_kg DECIMAL(8,2),
  volume_m3 DECIMAL(10,4),
  pack_type TEXT,
  carton_length_mm INT,
  carton_width_mm INT,
  carton_height_mm INT,
  materials JSONB,
  colors JSONB,
  price_usd DECIMAL(10,2) NOT NULL,
  cost_usd DECIMAL(10,2),
  moq INT DEFAULT 1,
  lead_time_weeks INT DEFAULT 8,
  stock_available INT DEFAULT 0,
  stock_reserved INT DEFAULT 0,
  stock_incoming INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, url)
);

-- Product variants (different fabric/finish = separate SKU)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  article_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_usd DECIMAL(10,2) NOT NULL,
  stock_available INT DEFAULT 0,
  stock_reserved INT DEFAULT 0,
  stock_incoming INT DEFAULT 0,
  variant_attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- B2C tables
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  address JSONB,
  tax_id TEXT,
  credit_limit_usd DECIMAL(12,2),
  payment_terms_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT DEFAULT 'MYR',
  subtotal_usd DECIMAL(12,2),
  discount_usd DECIMAL(12,2) DEFAULT 0,
  discount_code_id UUID,
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
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  unit_price_usd DECIMAL(10,2) NOT NULL,
  line_total_usd DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discount codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order_usd DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_tiers TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site-wide settings (single row, key-value JSONB)
CREATE TABLE site_settings (
  id INT PRIMARY KEY DEFAULT 1,
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
    "site_title": "Lotten",
    "site_description": "Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.",
    "og_image": "/og-default.jpg"
  },
  "default_currency": "MYR",
  "supported_currencies": ["MYR"]
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
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  value_usd DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_products_collection_id ON products(collection_id);
CREATE INDEX idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);
CREATE INDEX idx_search_analytics_session_id ON search_analytics(session_id);
CREATE INDEX idx_order_analytics_product_id ON order_analytics(product_id);
CREATE INDEX idx_order_analytics_customer_id ON order_analytics(customer_id);
CREATE INDEX idx_order_analytics_created_at ON order_analytics(created_at);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();