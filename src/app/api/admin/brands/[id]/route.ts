import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { safeRevalidateTag } from '@/lib/i18n/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase.from('brands').select('*').eq('id', id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const updatePayload: Record<string, unknown> = {
    name: body.name,
    description: body.description ?? null,
    updated_at: new Date().toISOString(),
  };

  if (body.translations && typeof body.translations === 'object') {
    updatePayload.translations = body.translations;
  }

  const { data, error } = await supabase
    .from('brands')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  safeRevalidateTag('brands');
  return NextResponse.json({ data });
}
