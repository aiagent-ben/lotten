import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { validateCsrfToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const search = searchParams.get('search') || '';
  const collectionFilter = searchParams.get('collection') || '';
  const statusFilter = searchParams.get('status') || '';

  let query = supabase
    .from('products')
    .select(
      `
      id,
      article_no,
      name,
      slug,
      collection_id,
      price_usd,
      stock_available,
      stock_reserved,
      is_active,
      is_new,
      is_bestseller,
      sort_order,
      created_at,
      collections:collection_id (id, name, slug),
      images:product_images!product_id (url, is_primary, sort_order, alt_text)
    `,
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,article_no.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  if (collectionFilter) {
    query = query.eq('collection_id', collectionFilter);
  }

  if (statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  } else if (statusFilter === 'new') {
    query = query.eq('is_new', true);
  } else if (statusFilter === 'bestseller') {
    query = query.eq('is_bestseller', true);
  } else if (statusFilter === 'low_stock') {
    query = query.lte('stock_available', 5);
  } else if (statusFilter === 'out_of_stock') {
    query = query.eq('stock_available', 0);
  }

  const { data: products, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedProducts = (products || []).map((p) => {
    const coll = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    return {
      ...p,
      collections: coll ? { id: coll.id, name: coll.name, slug: coll.slug } : null,
      images: p.images?.map((i) => ({ url: i.url, is_primary: i.is_primary, sort_order: i.sort_order })) || [],
      product_images: p.images?.map((i) => ({ url: i.url, is_primary: i.is_primary, sort_order: i.sort_order, alt_text: i.alt_text })) || [],
    };
  });

  return NextResponse.json({
    data: typedProducts,
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
  });
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  // CSRF protection for state-changing operations
  const body = await request.json();
  const csrfToken = body._csrf;
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const supabase = createServiceClient();

  try {
    // Handle bulk actions
    const { action, productIds, collectionId } = body;
    if (action && productIds) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return NextResponse.json({ success: false, error: 'No product IDs provided' }, { status: 400 });
      }

      if (action === 'activate') {
        const { error } = await supabase.from('products').update({ is_active: true }).in('id', productIds);
        if (error) throw error;
      } else if (action === 'deactivate') {
        const { error } = await supabase.from('products').update({ is_active: false }).in('id', productIds);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase.from('products').delete().in('id', productIds);
        if (error) throw error;
      } else if (action === 'change_collection' && collectionId) {
        const { error } = await supabase.from('products').update({ collection_id: collectionId }).in('id', productIds);
        if (error) throw error;
      } else {
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle product creation
    // Parse JSON fields
    const materials = typeof body.materials === 'string' ? JSON.parse(body.materials) : body.materials;
    const colors = typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors;
    const images = typeof body.images === 'string' ? JSON.parse(body.images) : body.images;
    const variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;

    // Generate slug from name if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        article_no: body.article_no,
        collection_id: body.collection_id,
        name: body.name,
        slug: slug,
        short_description: body.short_description,
        description: body.description,
        width_mm: body.width_mm ? parseInt(body.width_mm) : null,
        depth_mm: body.depth_mm ? parseInt(body.depth_mm) : null,
        height_mm: body.height_mm ? parseInt(body.height_mm) : null,
        weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
        volume_m3: body.volume_m3 ? parseFloat(body.volume_m3) : null,
        pack_type: body.pack_type,
        carton_length_mm: body.carton_length_mm ? parseInt(body.carton_length_mm) : null,
        carton_width_mm: body.carton_width_mm ? parseInt(body.carton_width_mm) : null,
        carton_height_mm: body.carton_height_mm ? parseInt(body.carton_height_mm) : null,
        materials: materials || [],
        colors: colors || [],
        price_usd: parseFloat(body.price_usd),
        cost_usd: body.cost_usd ? parseFloat(body.cost_usd) : null,
        moq: parseInt(body.moq) || 1,
        lead_time_weeks: parseInt(body.lead_time_weeks) || 8,
        stock_available: parseInt(body.stock_available) || 0,
        stock_reserved: parseInt(body.stock_reserved) || 0,
        stock_incoming: parseInt(body.stock_incoming) || 0,
        low_stock_threshold: parseInt(body.low_stock_threshold) || 5,
        is_active: body.is_active !== false,
        is_new: body.is_new === true,
        is_bestseller: body.is_bestseller === true,
        sort_order: parseInt(body.sort_order) || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert images if provided
    if (images && images.length > 0) {
      const productImages = images.map((img: any, index: number) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text || body.name,
        sort_order: img.sort_order || index,
        is_primary: img.is_primary || index === 0,
      }));
      await supabase.from('product_images').insert(productImages);
    }

    // Insert variants if provided
    if (variants && variants.length > 0) {
      const productVariants = variants.map((variant: any) => ({
        product_id: product.id,
        article_no: variant.article_no,
        name: variant.name,
        slug: variant.slug || variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        price_usd: parseFloat(variant.price_usd) || 0,
        stock_available: parseInt(variant.stock_available) || 0,
        variant_attributes: variant.variant_attributes || {},
        is_active: variant.is_active !== false,
      }));
      await supabase.from('product_variants').insert(productVariants);
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}