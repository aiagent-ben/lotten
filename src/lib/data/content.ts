import { createServiceClient } from '@/lib/db/client';
import { compileMDX } from '@/lib/mdx';
import { sanitizePostgrestSearch } from '@/lib/db/sanitize';
import { localizeContentPost } from '@/lib/i18n/localize';
import type { ContentPageTranslation, LocaleTranslations } from '@/lib/types/database';
import DOMPurify from 'isomorphic-dompurify';
import React from 'react';

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
  translations?: LocaleTranslations<ContentPageTranslation> | null;
}

interface ContentListParams {
  type?: 'blog' | 'guide' | 'lookbook' | 'page';
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  tag?: string;
  room_type?: string;
  style?: string;
  featured?: boolean;
  limit?: number;
  locale?: string;
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
    body_mdx: data.body_mdx || data.content_mdx || '',
    body_html: data.content_html || null,
    featured_image_url: data.featured_image_url,
    featured_image_alt: data.featured_image_alt,
    type: data.type,
    status: data.status,
    category: data.category || (Array.isArray(data.categories) && data.categories[0]?.name) || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    published_at: data.published_at,
    scheduled_at: data.scheduled_at,
    meta_title: data.seo_title || data.meta_title || data.title,
    meta_description: data.seo_description || data.meta_description || data.excerpt,
    og_image_url: data.seo_og_image || data.og_image_url || data.featured_image_url,
    canonical_url: data.canonical_url,
    read_time_minutes: data.read_time_minutes,
    view_count: data.view_count || 0,
    is_featured: data.is_featured || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author_id: data.author_id,
    room_type: data.room_type || null,
    style_tags: Array.isArray(data.style_tags) ? data.style_tags : [],
    featured_products: Array.isArray(data.featured_products) ? data.featured_products : [],
    hotspots: Array.isArray(data.hotspots) ? data.hotspots : [],
    template: data.template || 'default',
    translations: data.translations || null,
  };
}

function escapeLike(value: string): string {
  return sanitizePostgrestSearch(value);
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
    locale = 'en',
  } = params;

  let query = supabase
    .from('content_pages')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    const escapedSearch = escapeLike(search);
    if (escapedSearch) {
      query = query.or(
        `title.ilike.%${escapedSearch}%,slug.ilike.%${escapedSearch}%,excerpt.ilike.%${escapedSearch}%,translations->my->>title.ilike.%${escapedSearch}%,translations->zh->>title.ilike.%${escapedSearch}%`
      );
    }
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  if (params.room_type) {
    query = query.eq('room_type', params.room_type);
  }
  if (params.style) {
    query = query.contains('style_tags', [params.style]);
  }
  if (featured !== undefined) {
    query = query.eq('is_featured', featured);
  }

  const pageNum = Math.max(1, page);
  const perPageNum = Math.min(Math.max(1, perPage), 100);
  const limitNum = limit ? Math.min(Math.max(1, limit), 100) : undefined;

  if (limitNum) {
    query = query.limit(limitNum);
  } else {
    query = query.range((pageNum - 1) * perPageNum, pageNum * perPageNum - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching content:', error);
    return { data: [], count: 0, page: pageNum, perPage: perPageNum, totalPages: 0 };
  }

  return {
    data: (data || []).map((row) => localizeContentPost(mapContentFromDB(row), locale)),
    count: count || 0,
    page: pageNum,
    perPage: perPageNum,
    totalPages: Math.ceil((count || 0) / perPageNum),
  };
}

export async function getContentBySlug(
  slug: string,
  type?: 'blog' | 'guide' | 'lookbook' | 'page',
  locale = 'en'
): Promise<ContentPost | null> {
  const supabase = await getSupabase();

  let query = supabase
    .from('content_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return localizeContentPost(mapContentFromDB(data), locale);
}

export async function getContentById(id: string, locale = 'en'): Promise<ContentPost | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_pages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return localizeContentPost(mapContentFromDB(data), locale);
}

export async function getPublishedContentByType(
  type: 'blog' | 'guide' | 'lookbook' | 'page',
  limit = 10,
  locale = 'en'
): Promise<ContentPost[]> {
  const result = await getContentList({ type, status: 'published', limit, locale });
  return result.data;
}

export async function getFeaturedContent(limit = 5, locale = 'en'): Promise<ContentPost[]> {
  const result = await getContentList({ status: 'published', featured: true, limit, locale });
  return result.data;
}

export async function getRelatedContent(
  contentId: string,
  type: 'blog' | 'guide' | 'lookbook',
  tags: string[],
  limit = 3,
  locale = 'en'
): Promise<ContentPost[]> {
  const supabase = await getSupabase();

  if (tags.length === 0) {
    return getPublishedContentByType(type, limit, locale);
  }

  const { data, error } = await supabase
    .from('content_pages')
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

  return (data || []).map((row) => localizeContentPost(mapContentFromDB(row), locale));
}

export interface LocalizedContentCategory {
  value: string;
  label: string;
}

export async function getContentCategories(
  type?: 'blog' | 'guide' | 'lookbook',
  locale = 'en'
): Promise<LocalizedContentCategory[]> {
  const supabase = await getSupabase();

  let query = supabase
    .from('content_pages')
    .select('category, translations')
    .eq('status', 'published')
    .not('category', 'is', null);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    let catQuery = supabase
      .from('content_categories')
      .select('name, translations')
      .eq('is_active', true)
      .order('sort_order');

    if (type) {
      catQuery = catQuery.eq('type', type);
    }

    const { data: catData, error: catError } = await catQuery;
    if (catError) {
      console.error('Error fetching categories:', catError);
      return [];
    }
    return (catData || []).map((c: any) => ({
      value: c.name,
      label: (locale !== 'en' && c.translations?.[locale]?.name) || c.name,
    }));
  }

  const map = new Map<string, string>();
  data.forEach((c: any) => {
    if (c.category && !map.has(c.category)) {
      const trLabel = locale !== 'en' ? c.translations?.[locale]?.category : undefined;
      map.set(c.category, trLabel && trLabel.trim() ? trLabel : c.category);
    }
  });
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_pages')
    .select('tags')
    .eq('status', 'published');

  if (error || !data || data.length === 0) {
    const { data: tagData, error: tagError } = await supabase
      .from('content_tags')
      .select('name')
      .order('name');

    if (tagError) {
      console.error('Error fetching tags:', tagError);
      return [];
    }

    return (tagData || []).map((t) => t.name);
  }

  const set = new Set<string>();
  data.forEach((item: any) => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach((t: string) => {
        if (t) set.add(t);
      });
    }
  });
  return Array.from(set);
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await getSupabase();

  try {
    await supabase.rpc('increment_content_view_count', { content_id: id });
  } catch (err) {
    console.error('Failed to increment view count:', err);
  }
}

/**
 * Compile Markdown/MDX safely, falling back to sanitized HTML when content was
 * authored via Tiptap RichTextEditor (which outputs HTML attributes like style="...").
 */
export async function compileContentMDX(content: ContentPost): Promise<React.ReactElement> {
  const raw = content.body_mdx || '';
  const looksLikeHtml = /^\s*<(?:p|h[1-6]|ul|ol|div|blockquote|figure|table|section)\b/i.test(raw);

  if (looksLikeHtml) {
    const cleanHtml = DOMPurify.sanitize(raw);
    return React.createElement('div', {
      className: 'prose prose-stone max-w-none',
      dangerouslySetInnerHTML: { __html: cleanHtml },
    });
  }

  try {
    const result = await compileMDX(raw);
    return result.content;
  } catch {
    const cleanHtml = DOMPurify.sanitize(raw);
    return React.createElement('div', {
      className: 'prose prose-stone max-w-none',
      dangerouslySetInnerHTML: { __html: cleanHtml },
    });
  }
}

export async function getStaticParamsForType(type: 'blog' | 'guide' | 'lookbook' | 'page'): Promise<{ slug: string }[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('content_pages')
    .select('slug')
    .eq('type', type)
    .eq('status', 'published');

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({ slug: item.slug }));
}
