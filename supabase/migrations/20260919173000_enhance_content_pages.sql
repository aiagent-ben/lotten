-- Migration: Enhance content_pages schema to support full content management features
-- Add missing columns for categories, tags, lookbook metadata, templates, and analytics

ALTER TABLE content_pages
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_products TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hotspots JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS read_time_minutes INT,
  ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'default';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_pages_category ON content_pages(category);
CREATE INDEX IF NOT EXISTS idx_content_pages_tags ON content_pages USING GIN(tags);

-- RPC for incrementing view count
CREATE OR REPLACE FUNCTION increment_content_view_count(content_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_pages
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;
