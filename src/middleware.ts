import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/request';

export async function middleware(request: NextRequest) {
  // Handle locale prefix in URL
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to default locale
    const locale = defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url)
    );
  }

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

  // Check if this is an admin route (after locale)
  const isAdminRoute = pathname.startsWith(`/${defaultLocale}/admin`) || locales.some(
    (locale) => pathname.startsWith(`/${locale}/admin`)
  );
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  if (isAdminRoute) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL(`/${defaultLocale}/admin/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
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
      const loginUrl = new URL(`/${defaultLocale}/admin/login`, request.url);
      loginUrl.searchParams.set('error', 'Access denied');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Maintenance mode check for non-admin routes
  if (!isAdminRoute && !pathname.startsWith(`/${defaultLocale}/api`)) {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (settings?.settings?.maintenance_mode && !pathname.startsWith(`/${defaultLocale}/maintenance`)) {
      const maintenanceUrl = new URL(`/${defaultLocale}/maintenance`, request.url);
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