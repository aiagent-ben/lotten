import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/db/client';

export async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  let user: User | null = null;

  // 1. Check Bearer token from Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const serviceClient = createServiceClient();
      const { data, error } = await serviceClient.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  // 2. Fall back to reading auth session cookies via @supabase/ssr
  if (!user) {
    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data, error } = await ssrClient.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Verify admin profile from customers table
  const serviceClient = createServiceClient();
  const { data: profile, error: dbError } = await serviceClient
    .from('customers')
    .select('id, is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    console.error('Database error verifying admin profile:', dbError);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  if (!profile?.is_active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // authorized
}