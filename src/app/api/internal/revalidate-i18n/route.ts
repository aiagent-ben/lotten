import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { safeRevalidateTag } from '@/lib/i18n/cache';

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const provided = request.headers.get('x-internal-secret')?.trim();

  if (!serviceKey || provided !== serviceKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  safeRevalidateTag('products');
  safeRevalidateTag('collections');
  safeRevalidateTag('brands');
  safeRevalidateTag('content');
  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true });
}
