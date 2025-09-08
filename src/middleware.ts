import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lightweight auth presence check for middleware.
  // Avoid calling into jwt helpers (which call jwt.verify) because
  // Next.js middleware runs in the Edge runtime and Node's crypto is unavailable.
  // Instead, detect whether an auth token is present (auth header or auth cookies).
  let hasToken = false
  try {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieNames = cookieHeader
      .split(';')
      .map(c => c.split('=')[0].trim())
      .filter(Boolean)
    const hasAuthHeader = !!authHeader && authHeader.startsWith('Bearer ')
  // Prefer our own auth cookie. `_vercel_jwt` may be present but is not authoritative here.
  const hasAuthCookie = cookieNames.includes('auth-token')
  hasToken = hasAuthHeader || hasAuthCookie
  console.debug('[middleware] hasAuthHeader:', hasAuthHeader, 'hasAuthCookie:', hasAuthCookie, 'cookieNames:', cookieNames)
  } catch (e) {
    console.debug('[middleware] token presence check failed')
  }

  // Allow access to public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('/public') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next()
  }

  // For middleware we only do a conservative presence check. Detailed role-based
  // checks (admin vs photographer vs client) are enforced in API routes which run
  // in the Node runtime and can safely verify JWTs.

  // Protect admin routes: require an auth token (full role check happens server-side)
  if (pathname.startsWith('/admin')) {
    if (!hasToken) {
      return NextResponse.redirect(new URL('/auth/admin-login', request.url))
    }
  }

  // Protect photographer routes
  if (pathname.startsWith('/photographer') || pathname.startsWith('/dashboard')) {
    if (!hasToken) {
      return NextResponse.redirect(new URL('/auth/photographer-login', request.url))
    }
  }

  // Protect client routes (gallery access)
  if (pathname.startsWith('/gallery/') && !pathname.includes('/public')) {
    if (!hasToken) {
      return NextResponse.redirect(new URL('/auth/invite', request.url))
    }
  }

  // Protect API routes (require token presence; detailed verification occurs in API handlers)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/public')) {
    if (!hasToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}