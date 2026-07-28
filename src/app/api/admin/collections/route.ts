import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  const supabase = createServiceClient();
  
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: collections || [] });
}