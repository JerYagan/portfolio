import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, isSupabaseConfigured } from '@/lib/env';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminLogin = pathname === '/admin/login';

  if (!isSupabaseConfigured || !env.supabaseUrl || !env.supabasePublishableKey) {
    if (isAdminPage && !isAdminLogin) return NextResponse.redirect(new URL('/admin/login?error=configuration', request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || env.siteUrl.startsWith('https://'),
          sameSite: 'lax',
          path: '/',
        }));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (isAdminPage && !isAdminLogin && !data?.claims?.sub) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
