import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  
  let query = supabase
    .from('discount_codes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
    
  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
  }
  
  if (status) {
    if (status === 'active') {
      query = query.eq('is_active', true).lte('valid_from', new Date().toISOString()).gte('valid_until', new Date().toISOString());
    } else if (status === 'expired') {
      query = query.lt('valid_until', new Date().toISOString());
    } else if (status === 'upcoming') {
      query = query.gt('valid_from', new Date().toISOString());
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    data: data || [], 
    count: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage)
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  
  const body = await request.json();
  
  // Generate code if not provided
  const code = body.code || body.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12) + Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      code,
      name: body.name,
      description: body.description,
      type: body.type, // percentage | fixed_amount | free_shipping
      value: body.value,
      min_order_amount: body.min_order_amount || null,
      max_discount_amount: body.max_discount_amount || null,
      usage_limit: body.usage_limit || null,
      usage_limit_per_customer: body.usage_limit_per_customer || 1,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      is_active: body.is_active !== false,
      applicable_collections: body.applicable_collections || null,
      applicable_products: body.applicable_products || null,
      applicable_categories: body.applicable_categories || null,
      customer_segments: body.customer_segments || null,
      first_order_only: body.first_order_only || false,
    })
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}