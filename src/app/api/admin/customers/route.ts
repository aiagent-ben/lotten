import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
    
  if (search) {
    query = query.or(`email.ilike.%${search}%,contact_name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }
  
  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
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

export async function POST(request: Request) {
  const supabase = createServiceClient();
  
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email: body.email,
        company_name: body.company_name,
        contact_name: body.contact_name,
        phone: body.phone,
        address: body.address,
        tax_id: body.tax_id,
        credit_limit_usd: body.credit_limit_usd || 0,
        payment_terms_days: body.payment_terms_days || 30,
        is_active: body.is_active !== false,
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}