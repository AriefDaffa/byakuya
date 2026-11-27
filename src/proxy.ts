import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';
import { sanitizeRedirectPath } from '@/types/auth';

const AUTH_PAGES = ['/login', '/register'];
const AUTH_ROUTE_PREFIXES = ['/auth', '/api/auth'];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname);
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Login/register submissions and future auth endpoints must stay reachable
  // regardless of the current session state.
  if (isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isAuthPage(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    // API routes answer for themselves with 401 instead of HTML redirects.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', sanitizeRedirectPath(`${pathname}${search}`));

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
