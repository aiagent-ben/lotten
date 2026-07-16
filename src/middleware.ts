import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  if (isAdminRoute) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('customers')
      .select('is_active')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      // Sign out and redirect
      await supabase.auth.signOut();
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'Access denied');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Maintenance mode check for non-admin routes
  if (!isAdminRoute && !request.nextUrl.pathname.startsWith('/api')) {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (settings?.settings?.maintenance_mode && !request.nextUrl.pathname.startsWith('/maintenance')) {
      const maintenanceUrl = new URL('/maintenance', request.url);
      return NextResponse.rewrite(maintenanceUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};