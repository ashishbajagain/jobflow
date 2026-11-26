import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_CONFIG } from '@/lib/auth/config';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
];
const PUBLIC_API_PREFIXES = ['/api/auth/'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Edge middleware only gates on cookie presence.
 * Full JWT verification happens in Node (API routes / server components),
 * where AUTH_SECRET is reliably available. Verifying here caused valid
 * sessions to be treated as expired when Edge lacked the secret.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_CONFIG.sessionCookie)?.value ?? null;
  const isPublic = isPublicPath(pathname);

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
