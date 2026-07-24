-- Add categories column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Add index for categories
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN (categories);
