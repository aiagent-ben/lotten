/**
 * Database Types - Generated from SPEC.md schema
 * These types mirror the Supabase database schema
 */

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

export interface MaterialSpec {
  part: string;
  material: string;
  finish: string;
  code: string;
}

export interface ColorOption {
  part: string;
  name: string;
  code: string;
  hex: string;
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
  created_at: string;
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
  variant_attributes: Record<string, string>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  price_usd: number;
  cost_usd: number | null;
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

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
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

export interface SearchAnalytics {
  id: number;
  query: string;
  filters: Record<string, unknown>;
  results_count: number;
  user_id: string | null;
  session_id: string;
  created_at: string;
}

export type OrderAnalyticsEventType = 'view' | 'add_to_cart' | 'checkout_start' | 'order_complete';

export interface OrderAnalytics {
  id: number;
  event_type: OrderAnalyticsEventType;
  product_id: string | null;
  variant_id: string | null;
  customer_id: string | null;
  session_id: string;
  order_id: string | null;
  value_usd: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}