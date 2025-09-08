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

    // Clear the auth token cookie (explicit path) and set immediate expiry.
    try {
      const isProd = process.env.NODE_ENV === 'production'
      let cookieDomain: string | undefined = process.env.COOKIE_DOMAIN || undefined
      if (cookieDomain) {
        if (!cookieDomain.startsWith('.')) cookieDomain = `.${cookieDomain}`
      }

      const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
      }
      if (cookieDomain) cookieOptions.domain = cookieDomain
      response.cookies.set('auth-token', '', cookieOptions)
    } catch (e) {
      /* ignore cookie API errors */
    }

    // Also set header fallback
    try {
      const isProd = process.env.NODE_ENV === 'production'
      let cookieDomain: string | undefined = process.env.COOKIE_DOMAIN || undefined
      if (cookieDomain && !cookieDomain.startsWith('.')) cookieDomain = `.${cookieDomain}`

      const parts = ['auth-token=','HttpOnly','Path=/','Max-Age=0', `SameSite=${isProd ? 'None' : 'Lax'}`]
      if (isProd) parts.push('Secure')
      if (cookieDomain) parts.push(`Domain=${cookieDomain}`)
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