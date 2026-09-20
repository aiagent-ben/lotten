import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('content_pages')
      .select(`
        *,
        categories:content_categories(id, name, slug),
        tags_rel:content_tags(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      console.error('Error fetching content by id:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/content/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const { id } = await params;
    const body = await request.json();

    const readTime = body.read_time_minutes || (body.body_mdx ? Math.max(1, Math.ceil(body.body_mdx.trim().split(/\s+/).length / 200)) : 1);

    const updateData: any = {
      slug: body.slug,
      title: body.title,
      body_mdx: body.body_mdx,
      excerpt: body.excerpt || null,
      type: body.type,
      status: body.status,
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
      read_time_minutes: readTime,
      template: body.template || 'default',
      is_featured: Boolean(body.is_featured),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('content_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update categories
    if (body.categoryIds) {
      await supabase.from('content_page_categories').delete().eq('content_page_id', id);
      if (body.categoryIds.length > 0) {
        const categoryLinks = body.categoryIds.map((categoryId: string) => ({
          content_page_id: id,
          content_category_id: categoryId,
        }));
        await supabase.from('content_page_categories').insert(categoryLinks);
      }
    } else if (body.category && typeof body.category === 'string') {
      await supabase.from('content_page_categories').delete().eq('content_page_id', id);
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
          content_page_id: id,
          content_category_id: categoryId,
        });
      }
    }

    // Update tags
    if (body.tagIds) {
      await supabase.from('content_page_tags').delete().eq('content_page_id', id);
      if (body.tagIds.length > 0) {
        const tagLinks = body.tagIds.map((tagId: string) => ({
          content_page_id: id,
          content_tag_id: tagId,
        }));
        await supabase.from('content_page_tags').insert(tagLinks);
      }
    } else if (Array.isArray(body.tags) && body.tags.length > 0) {
      await supabase.from('content_page_tags').delete().eq('content_page_id', id);
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
            content_page_id: id,
            content_tag_id: tagId,
          });
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/admin/content/[id]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const { id } = await params;

    const { error } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}