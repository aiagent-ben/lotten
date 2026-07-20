import { createServiceClient } from '@/lib/db/client';
import { compileMDX } from '@/lib/mdx';

export interface ContentPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_mdx: string;
  body_html: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  type: 'blog' | 'guide' | 'lookbook' | 'page';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  category: string | null;
  tags: string[];
  published_at: string | null;
  scheduled_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  read_time_minutes: number | null;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  // Lookbook specific
  room_type: string | null;
  style_tags: string[];
  featured_products: string[];
  hotspots: Array<{ productId: string; x: number; y: number; label: string; tooltip: string }>;
  // Page specific
  template: string;
}

interface ContentListParams {
  type?: 'blog' | 'guide' | 'lookbook' | 'page';
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
}

interface ContentListResponse {
  data: ContentPost[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}

async function getSupabase() {
  return createServiceClient();
}

function mapContentFromDB(data: any): ContentPost {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    body_mdx: data.content_mdx,
    body_html: data.content_html,
    featured_image_url: data.featured_image_url,
    featured_image_alt: data.featured_image_alt,
    type: data.type,
    status: data.status,
    category: data.category,
    tags: data.tags || [],
    published_at: data.published_at,
    scheduled_at: data.scheduled_at,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    og_image_url: data.og_image_url,
    canonical_url: data.canonical_url,
    read_time_minutes: data.read_time_minutes,
    view_count: data.view_count || 0,
    is_featured: data.is_featured || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author_id: data.author_id,
    room_type: data.room_type || null,
    style_tags: data.style_tags || [],
    featured_products: data.featured_products || [],
    hotspots: data.hotspots || [],
    template: data.template || 'default',
  };
}

export async function getContentList(params: ContentListParams = {}): Promise<ContentListResponse> {
  const supabase = await getSupabase();
  const {
    type,
    status = 'published',
    page = 1,
    perPage = 10,
    search,
    category,
    tag,
    featured,
    limit,
  } = params;

  let query = supabase
    .from('content_posts')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  if (featured !== undefined) {
    query = query.eq('is_featured', featured);
  }

  if (limit) {
    query = query.limit(limit);
  } else {
    query = query.range((page - 1) * perPage, page * perPage - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching content:', error);
    return { data: [], count: 0, page, perPage, totalPages: 0 };
  }

  return {
    data: (data || []).map(mapContentFromDB),
    count: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}

export async function getContentBySlug(slug: string, type?: 'blog' | 'guide' | 'lookbook' | 'page'): Promise<ContentPost | null> {
  const supabase = await getSupabase();

  let query = supabase
    .from('content_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return mapContentFromDB(data);
}

export async function getContentById(id: string): Promise<ContentPost | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapContentFromDB(data);
}

export async function getPublishedContentByType(type: 'blog' | 'guide' | 'lookbook' | 'page', limit = 10): Promise<ContentPost[]> {
  const result = await getContentList({ type, status: 'published', limit });
  return result.data;
}

export async function getFeaturedContent(limit = 5): Promise<ContentPost[]> {
  const result = await getContentList({ status: 'published', featured: true, limit });
  return result.data;
}

export async function getRelatedContent(contentId: string, type: 'blog' | 'guide' | 'lookbook', tags: string[], limit = 3): Promise<ContentPost[]> {
  const supabase = await getSupabase();

  if (tags.length === 0) {
    return getPublishedContentByType(type, limit);
  }

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('type', type)
    .eq('status', 'published')
    .neq('id', contentId)
    .overlaps('tags', tags)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related content:', error);
    return [];
  }

  return (data || []).map(mapContentFromDB);
}

export async function getContentCategories(type?: 'blog' | 'guide' | 'lookbook'): Promise<string[]> {
  const supabase = await getSupabase();

  let query = supabase
    .from('content_categories')
    .select('name')
    .eq('is_active', true)
    .order('sort_order');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map((c) => c.name);
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_tags')
    .select('name')
    .order('name');

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return (data || []).map((t) => t.name);
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await getSupabase();

  await supabase.rpc('increment_content_view_count', { content_id: id });
}

export async function compileContentMDX(content: ContentPost): Promise<any> {
  const result = await compileMDX(content.body_mdx);
  // For RSC, we return the compiled React element directly
  // The page components will handle rendering
  return result.content;
}

export async function getStaticParamsForType(type: 'blog' | 'guide' | 'lookbook' | 'page'): Promise<{ slug: string }[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_posts')
    .select('slug')
    .eq('type', type)
    .eq('status', 'published');

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({ slug: item.slug }));
}