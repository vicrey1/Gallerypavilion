import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Canonicalize domain: force www to keep __Host cookies consistent in production
    const host = req.headers.get('host')
    if (host === 'gallerypavilion.com') {
      const url = new URL(req.url)
      url.hostname = 'www.gallerypavilion.com'
      return NextResponse.redirect(url)
    }

    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isGallery = req.nextUrl.pathname.startsWith('/gallery')

    const isAdmin = req.nextUrl.pathname.startsWith('/admin')

    // Redirect authenticated users away from auth pages (except signup pages, photographer login, and admin login)
    if (isAuthPage && isAuth && !req.nextUrl.pathname.includes('/signup') && !req.nextUrl.pathname.includes('/photographer-login') && !req.nextUrl.pathname.includes('/admin-login')) {
      if (token.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    // Protect dashboard routes - only photographers
    if (isDashboard && (!isAuth || token.role !== 'photographer')) {
      return NextResponse.redirect(new URL('/auth/photographer-login', req.url))
    }

    // Protect admin routes - only admins
    if (isAdmin && (!isAuth || token.role !== 'admin')) {
      return NextResponse.redirect(new URL('/auth/admin-login', req.url))
    }

    // Gallery access - require authentication and proper role
    if (isGallery && !req.nextUrl.pathname.includes('/demo')) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/invite', req.url))
      }
      
      // Allow photographers to access their galleries
      if (token.role === 'photographer') {
        return NextResponse.next()
      }
      
      // For public gallery views, allow clients with valid invite codes
      if (req.nextUrl.pathname.includes('/public')) {
        if (token.role !== 'client' || !token.inviteCode) {
          return NextResponse.redirect(new URL('/invite', req.url))
        }
      } else {
        // For non-public gallery routes, only photographers should access
        if (token.role !== 'photographer') {
          return NextResponse.redirect(new URL('/auth/photographer-login', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public pages
        const publicPaths = ['/', '/auth', '/invite']
        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
        )
        
        if (isPublicPath) return true
        
        // Allow admin routes (will be handled by main middleware function)
        if (req.nextUrl.pathname.startsWith('/admin')) return true
        
        // Require authentication for other protected routes
        return !!token
      },
    },
  }
)

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