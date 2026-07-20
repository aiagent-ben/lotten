-- Content Management System (MDX)
-- Blog posts, care guides, lookbooks, static pages

CREATE TABLE content_pages (
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
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories for content (blog categories, guide topics, lookbook themes)
CREATE TABLE content_categories (
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

-- Many-to-many relationship between content and categories
CREATE TABLE content_page_categories (
  content_page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  content_category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_page_id, content_category_id)
);

-- Tags for content
CREATE TABLE content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_page_tags (
  content_page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  content_tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_page_id, content_tag_id)
);

-- Indexes
CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_type ON content_pages(type);
CREATE INDEX idx_content_pages_status ON content_pages(status);
CREATE INDEX idx_content_pages_published_at ON content_pages(published_at);
CREATE INDEX idx_content_pages_type_status ON content_pages(type, status);
CREATE INDEX idx_content_pages_scheduled_at ON content_pages(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_content_categories_slug ON content_categories(slug);
CREATE INDEX idx_content_categories_type ON content_categories(type);

-- Updated_at triggers
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();