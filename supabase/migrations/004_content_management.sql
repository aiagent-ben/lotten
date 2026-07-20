-- Content Management (MDX-based)
-- Posts, Lookbooks, Pages

CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_mdx TEXT NOT NULL,
  content_html TEXT,
  featured_image_url TEXT,
  featured_image_alt TEXT,
  author_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  tags TEXT[],
  category TEXT, -- 'care-guide', 'styling-tips', 'trends', 'lookbook', 'news'
  read_time_minutes INT,
  view_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_lookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  intro_mdx TEXT,
  intro_html TEXT,
  room_type TEXT, -- 'living-room', 'bedroom', 'dining-room', 'office', 'outdoor'
  style_tags TEXT[], -- 'modern', 'scandinavian', 'industrial', 'mid-century', 'minimalist'
  featured_products UUID[], -- product IDs
  hotspots JSONB, -- array of {product_id, x, y, label, tooltip}
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_mdx TEXT NOT NULL,
  content_html TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  template TEXT DEFAULT 'default', -- 'default', 'landing', 'wide'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_category ON content_posts(category);
CREATE INDEX idx_content_posts_published_at ON content_posts(published_at);
CREATE INDEX idx_content_posts_slug ON content_posts(slug);
CREATE INDEX idx_content_lookbooks_status ON content_lookbooks(status);
CREATE INDEX idx_content_lookbooks_room_type ON content_lookbooks(room_type);
CREATE INDEX idx_content_lookbooks_slug ON content_lookbooks(slug);
CREATE INDEX idx_content_pages_status ON content_pages(status);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);

-- Triggers
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_lookbooks_updated_at BEFORE UPDATE ON content_lookbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();