import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();
  const { id: productId } = await params;
  
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      collections:collection_id (id, name, slug),
      images:product_images (id, url, alt_text, sort_order, is_primary),
      variants:product_variants (id, article_no, name, slug, price_usd, stock_available, variant_attributes, is_active)
    `)
    .eq('id', productId)
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();
  const { id: productId } = await params;
  
  const body = await request.json();
  
  // Parse JSON fields
  const materials = typeof body.materials === 'string' ? JSON.parse(body.materials) : body.materials;
  const colors = typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors;
  
  const { data, error } = await supabase
    .from('products')
    .update({
      article_no: body.article_no,
      collection_id: body.collection_id,
      name: body.name,
      slug: body.slug,
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
      materials: materials,
      colors: colors,
      price_usd: parseFloat(body.price_usd),
      cost_usd: body.cost_usd ? parseFloat(body.cost_usd) : null,
      moq: parseInt(body.moq),
      lead_time_weeks: parseInt(body.lead_time_weeks),
      stock_available: parseInt(body.stock_available),
      stock_reserved: parseInt(body.stock_reserved),
      stock_incoming: parseInt(body.stock_incoming),
      low_stock_threshold: parseInt(body.low_stock_threshold),
      is_active: body.is_active,
      is_new: body.is_new,
      is_bestseller: body.is_bestseller,
      sort_order: parseInt(body.sort_order),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}