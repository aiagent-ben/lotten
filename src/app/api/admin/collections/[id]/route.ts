import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { safeRevalidateTag } from '@/lib/i18n/cache';
import { syncCollectionProductsInMeilisearch } from '@/lib/search/reindex';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase.from('collections').select('*');
  const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('slug', id)).single();

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
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  if (body.translations && typeof body.translations === 'object') {
    updatePayload.translations = body.translations;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase.from('collections').update(updatePayload);
  const { data, error } = await (isUuid ? query.eq('id', id) : query.eq('slug', id)).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  safeRevalidateTag('collections');
  safeRevalidateTag('products');
  if (data?.id) {
    try {
      await syncCollectionProductsInMeilisearch(data.id);
    } catch (err) {
      console.error('Meilisearch collection sync error:', err);
    }
  }
  return NextResponse.json({ data });
}
