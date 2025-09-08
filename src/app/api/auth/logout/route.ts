import { NextRequest, NextResponse } from 'next/server'

// Minimal cookie options interface to avoid adding external deps
interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  domain?: string
  maxAge?: number
}

export async function POST(_request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the auth token cookie (explicit path) and set immediate expiry
    try {
      const isProd = process.env.NODE_ENV === 'production'
      const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
      }
      cookieOptions.domain = process.env.COOKIE_DOMAIN || (isProd ? '.gallerypavilion.com' : undefined)
      response.cookies.set('auth-token', '', cookieOptions)
    } catch (e) {
      /* ignore cookie API errors */
    }

    // Also set header fallback
    try {
      const isProd = process.env.NODE_ENV === 'production'
  const parts = ['auth-token=','HttpOnly','Path=/','Max-Age=0', 'SameSite=Lax']
  if (isProd) parts.push('Secure')
  parts.push(`Domain=${process.env.COOKIE_DOMAIN || '.gallerypavilion.com'}`)
      response.headers.set('Set-Cookie', parts.join('; '))
    } catch (e) {
      /* ignore */
    }

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}