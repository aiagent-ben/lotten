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
    .from('promotions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
    
  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (status) {
    query = query.eq('status', status);
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
  
  // Generate slug from name if not provided
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      name: body.name,
      slug,
      description: body.description,
      type: body.type,
      status: body.status || 'draft',
      is_active: body.is_active !== false,
      valid_from: body.valid_from || new Date().toISOString(),
      valid_until: body.valid_until || null,
      priority: body.priority || 100,
      can_stack: body.can_stack || false,
      usage_limit: body.usage_limit || null,
      usage_limit_per_customer: body.usage_limit_per_customer || 1,
      conditions: body.conditions || {},
      actions: body.actions || {},
    })
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}