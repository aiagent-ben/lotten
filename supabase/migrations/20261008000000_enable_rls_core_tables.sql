-- Enable Row Level Security (RLS) on core tables created in 001_initial_schema
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- CUSTOMERS POLICIES
-- Authenticated users can view their own customer record
CREATE POLICY "Users can view own customer profile"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Authenticated users can update their own customer record
CREATE POLICY "Users can update own customer profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- ORDERS POLICIES
-- Authenticated users can view orders belonging to their customer profile
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- ORDER ITEMS POLICIES
-- Authenticated users can view order items for their own orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT o.id FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));

-- DISCOUNT CODES POLICIES
-- Active discount codes are readable by public (anon and authenticated) for checkout validation
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
