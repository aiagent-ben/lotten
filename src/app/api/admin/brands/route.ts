import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(request: Request) {
  const supabase = createServiceClient();
  
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: brands || [] });
}