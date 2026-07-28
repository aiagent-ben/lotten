import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optionally verify admin role from customers table
  const { data: profile } = await supabase
    .from('customers')
    .select('is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile?.is_active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // authorized
}