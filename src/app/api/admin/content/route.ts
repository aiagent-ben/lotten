import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('content_pages')
      .select(`
        *,
        content_categories!content_page_categories(content_category_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: content, error, count } = await query
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: content || [],
      count: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('content_pages')
      .insert({
        slug: body.slug,
        title: body.title,
        body_mdx: body.body_mdx,
        excerpt: body.excerpt,
        type: body.type,
        status: body.status || 'draft',
        featured_image_url: body.featured_image_url,
        featured_image_alt: body.featured_image_alt,
        seo_title: body.seo_title,
        seo_description: body.seo_description,
        seo_og_image: body.seo_og_image,
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        scheduled_at: body.scheduled_at || null,
        author_id: body.author_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle categories
    if (body.categoryIds && body.categoryIds.length > 0) {
      const categoryLinks = body.categoryIds.map((categoryId: string) => ({
        content_page_id: data.id,
        content_category_id: categoryId,
      }));
      await supabase.from('content_page_categories').insert(categoryLinks);
    }

    // Handle tags
    if (body.tagIds && body.tagIds.length > 0) {
      const tagLinks = body.tagIds.map((tagId: string) => ({
        content_page_id: data.id,
        content_tag_id: tagId,
      }));
      await supabase.from('content_page_tags').insert(tagLinks);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}