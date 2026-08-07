import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/request';

// Cache for maintenance mode settings
let cachedSettings: any = null;
let cachedSettingsExpiresAt = 0;

function getSupabaseClient(request: NextRequest, response: { current: NextResponse }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string; options: CookieOptions }) => request.cookies.set(name, value));
          response.current = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
            response.current.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

// Admin lives outside the [locale] tree (src/app/admin), so it's handled
// separately and is never redirected to a locale-prefixed URL.
async function handleAdminAuth(request: NextRequest, pathname: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const response = { current: NextResponse.next({ request }) };
  const supabase = getSupabaseClient(request, response);

  // Login page must stay reachable to unauthenticated users, otherwise
  // the redirect-to-login below would redirect to itself forever.
  if (pathname === '/admin/login') {
    return response.current;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('customers')
    .select('is_active')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'Access denied');
    return NextResponse.redirect(loginUrl);
  }

  return response.current;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    return handleAdminAuth(request, pathname);
  }

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

  const response = { current: NextResponse.next({ request }) };
  const supabase = getSupabaseClient(request, response);

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  // Maintenance mode check
  const isMaintenancePage = locales.some(locale =>
    pathname.startsWith(`/${locale}/maintenance`)
  );

  // Cache maintenance mode check
  let settings = cachedSettings;
  if (!settings || cachedSettingsExpiresAt < Date.now()) {
    const { data } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single();
    settings = data?.settings ?? null;
    cachedSettings = settings;
    cachedSettingsExpiresAt = Date.now() + 30_000; // 30 seconds
  }

  if (settings?.maintenance_mode && !isMaintenancePage) {
    const maintenanceUrl = new URL(`/${defaultLocale}/maintenance`, request.url);
    return NextResponse.rewrite(maintenanceUrl);
  }

  return response.current;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$|api/).*)',
  ],
};
