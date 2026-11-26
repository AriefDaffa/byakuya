import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/types/auth';

type RedirectTarget = {
  pathname: string;
  next?: string;
};

/**
 * Builds a redirect response that keeps every cookie Supabase refreshed during
 * the auth check. Without this, rotated access/refresh tokens are dropped and
 * the browser keeps using stale credentials.
 */
function redirectWithCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  target: RedirectTarget,
) {
  const url = request.nextUrl.clone();
  url.pathname = target.pathname;
  url.search = '';

  if (target.next && target.next !== '/') {
    url.searchParams.set('next', target.next);
  }

  const redirectResponse = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Allow auth callbacks/confirmations to run regardless of session state.
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  if (isAuthRoute) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login, keeping the destination around.
  if (!user && !isAuthPage) {
    const next = sanitizeRedirectPath(`${pathname}${search}`);

    return redirectWithCookies(request, supabaseResponse, {
      pathname: '/login',
      next,
    });
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    return redirectWithCookies(request, supabaseResponse, { pathname: '/' });
  }

  return supabaseResponse;
}
