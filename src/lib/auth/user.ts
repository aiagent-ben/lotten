import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/db/client';

export interface CustomerProfile {
  id: string;
  auth_user_id: string;
  email: string;
  is_active: boolean;
  role?: string;
}

/**
 * Resolves the authenticated Supabase user from either:
 * 1. An Authorization: Bearer <token> header on the incoming Request
 * 2. Next.js request cookies via @supabase/ssr
 */
export async function getAuthenticatedUser(request?: Request): Promise<User | null> {
  let user: User | null = null;

  if (request) {
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
  }

  if (!user) {
    try {
      const cookieStore = await cookies();
      const ssrClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );
      const { data, error } = await ssrClient.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    } catch {
      // cookies() might throw if invoked outside request/action lifecycle
    }
  }

  return user;
}

/**
 * Resolves the customer database profile associated with the authenticated user.
 */
export async function getAuthenticatedCustomer(request?: Request): Promise<{
  user: User;
  customer: CustomerProfile;
} | null> {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;

  const supabase = createServiceClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, auth_user_id, email, is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !customer) {
    return null;
  }

  return { user, customer };
}
