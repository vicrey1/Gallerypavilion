import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from './lib/jwt'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const user = getUserFromRequest(request)

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

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/admin-login', request.url))
    }
  }

  // Protect photographer routes
  if (pathname.startsWith('/photographer') || pathname.startsWith('/dashboard')) {
    if (!user || user.role !== 'photographer') {
      return NextResponse.redirect(new URL('/auth/photographer-login', request.url))
    }
  }

  // Protect client routes (gallery access)
  if (pathname.startsWith('/gallery/') && !pathname.includes('/public')) {
    if (!user || (user.role !== 'client' && user.role !== 'photographer' && user.role !== 'admin')) {
      return NextResponse.redirect(new URL('/auth/invite', request.url))
    }
  }

  // Protect API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/public')) {
    if (!user) {
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