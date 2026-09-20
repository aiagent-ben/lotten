import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('content_pages')
      .select(`
        *,
        categories:content_categories(id, name, slug),
        tags_rel:content_tags(id, name, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      const sanitized = search.replace(/[\\%_]/g, '\\$&');
      query = query.or(`title.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`);
    }

    const { data: content, error, count } = await query
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) {
      console.error('Error fetching admin content:', error);
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
    console.error('Error in GET /api/admin/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const readTime = body.read_time_minutes || (body.body_mdx ? Math.max(1, Math.ceil(body.body_mdx.trim().split(/\s+/).length / 200)) : 1);

    const { data, error } = await supabase
      .from('content_pages')
      .insert({
        slug: body.slug,
        title: body.title,
        body_mdx: body.body_mdx,
        excerpt: body.excerpt || null,
        type: body.type,
        status: body.status || 'draft',
        category: body.category || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        room_type: body.room_type || null,
        style_tags: Array.isArray(body.style_tags) ? body.style_tags : [],
        featured_products: Array.isArray(body.featured_products) ? body.featured_products : [],
        hotspots: Array.isArray(body.hotspots) ? body.hotspots : [],
        featured_image_url: body.featured_image_url || null,
        featured_image_alt: body.featured_image_alt || null,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        seo_og_image: body.seo_og_image || null,
        published_at: body.status === 'published' ? (body.published_at || new Date().toISOString()) : (body.published_at || null),
        scheduled_at: body.scheduled_at || null,
        author_id: body.author_id || null,
        read_time_minutes: readTime,
        template: body.template || 'default',
        is_featured: Boolean(body.is_featured),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting content page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle categories if explicit IDs or string category provided
    if (body.categoryIds && body.categoryIds.length > 0) {
      const categoryLinks = body.categoryIds.map((categoryId: string) => ({
        content_page_id: data.id,
        content_category_id: categoryId,
      }));
      await supabase.from('content_page_categories').insert(categoryLinks);
    } else if (body.category && typeof body.category === 'string') {
      const catSlug = body.category.toLowerCase().trim().replace(/[\s_]+/g, '-');
      const { data: existingCat } = await supabase
        .from('content_categories')
        .select('id')
        .eq('slug', catSlug)
        .maybeSingle();

      let categoryId = existingCat?.id;
      if (!categoryId) {
        const { data: newCat } = await supabase
          .from('content_categories')
          .insert({
            name: body.category,
            slug: catSlug,
            type: ['blog', 'guide', 'lookbook'].includes(body.type) ? body.type : 'blog',
          })
          .select('id')
          .maybeSingle();
        categoryId = newCat?.id;
      }
      if (categoryId) {
        await supabase.from('content_page_categories').insert({
          content_page_id: data.id,
          content_category_id: categoryId,
        });
      }
    }

    // Handle tags if explicit IDs or array of tag names provided
    if (body.tagIds && body.tagIds.length > 0) {
      const tagLinks = body.tagIds.map((tagId: string) => ({
        content_page_id: data.id,
        content_tag_id: tagId,
      }));
      await supabase.from('content_page_tags').insert(tagLinks);
    } else if (Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagName of body.tags) {
        if (!tagName || typeof tagName !== 'string') continue;
        const tagSlug = tagName.toLowerCase().trim().replace(/[\s_]+/g, '-');
        const { data: existingTag } = await supabase
          .from('content_tags')
          .select('id')
          .eq('slug', tagSlug)
          .maybeSingle();

        let tagId = existingTag?.id;
        if (!tagId) {
          const { data: newTag } = await supabase
            .from('content_tags')
            .insert({ name: tagName.trim(), slug: tagSlug })
            .select('id')
            .maybeSingle();
          tagId = newTag?.id;
        }
        if (tagId) {
          await supabase.from('content_page_tags').insert({
            content_page_id: data.id,
            content_tag_id: tagId,
          });
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in POST /api/admin/content:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}