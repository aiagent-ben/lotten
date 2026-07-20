import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();
  const { id } = await params;
  
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();
  const { id } = await params;
  
  const body = await request.json();
  
  // Don't allow changing ID or created_at
  const { id: _, created_at, used_count, ...updateData } = body;
  
  // Generate slug from name if name changed
  if (body.name && !body.slug) {
    updateData.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  }
  
  const { data, error } = await supabase
    .from('promotions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();
  const { id } = await params;
  
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}