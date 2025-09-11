import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const path = req.nextUrl.pathname
    
    console.log('Middleware processing path:', path)

    // Always allow access to these paths without authentication
    if (path.startsWith('/invite') || path.includes('/gallery/') && path.includes('/invite')) {
      console.log('Allowing access to invite-related page')
      return NextResponse.next()
    }

    // Handle auth pages (login, signup, etc.)
    if (path.startsWith('/auth')) {
      if (isAuth && !path.includes('/signup')) {
        // Redirect authenticated users away from auth pages (except signup)
        const redirectUrl = token?.role === 'admin' ? '/admin' : 
                          token?.role === 'client' ? '/client' : '/dashboard'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      return NextResponse.next()
    }

    // Protect admin routes
    if (path.startsWith('/admin') && (!isAuth || token?.role !== 'admin')) {
      return NextResponse.redirect(new URL('/auth/admin-login', req.url))
    }

    // Protect dashboard routes
    if (path.startsWith('/dashboard') && (!isAuth || token?.role !== 'photographer')) {
      return NextResponse.redirect(new URL('/auth/photographer-login', req.url))
    }

    // Handle gallery routes
    if (path.startsWith('/gallery') && !path.includes('/demo')) {
      // Allow any access to /gallery/[id]/invite routes
      if (path.includes('/invite')) {
        return NextResponse.next()
      }

      // For other gallery routes, require photographer authentication
      if (!isAuth || token?.role !== 'photographer') {
        return NextResponse.redirect(new URL('/invite', req.url))
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