import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('content_pages')
      .select(`
        *,
        content_categories!content_page_categories(content_category_id),
        content_tags!content_page_tags(content_tag_id)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      slug: body.slug,
      title: body.title,
      body_mdx: body.body_mdx,
      excerpt: body.excerpt,
      type: body.type,
      status: body.status,
      featured_image_url: body.featured_image_url,
      featured_image_alt: body.featured_image_alt,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      seo_og_image: body.seo_og_image,
      published_at: body.status === 'published' && !body.published_at ? new Date().toISOString() : body.published_at,
      scheduled_at: body.scheduled_at || null,
    };

    const { data, error } = await supabase
      .from('content_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
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
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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