import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  type: z.enum(['photographer', 'admin', 'client']).optional().default('photographer')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, type } = validationResult.data
    // Log email and incoming cookie header presence for debugging (do not log password)
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      console.debug('[auth/login] attempt for email:', email.toLowerCase(), 'cookieHeaderPresent:', !!cookieHeader)
    } catch (logE) {
      /* ignore logging errors */
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        photographer: true,
        client: true
      }
    })

    if (!user || !user.password) {
      console.debug('[auth/login] user not found or missing password for email:', email.toLowerCase())
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.debug('[auth/login] invalid password for user:', user.id, 'email:', user.email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check user role matches login type
    if (type === 'photographer' && user.role !== 'photographer') {
      console.debug('[auth/login] role mismatch for login type=photographer userRole=', user.role, 'userId=', user.id)
      return NextResponse.json(
        { error: 'Invalid credentials for photographer login' },
        { status: 401 }
      )
    }

    if (type === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid credentials for admin login' },
        { status: 401 }
      )
    }

    // For photographers, check approval status
    if (user.role === 'photographer' && user.photographer) {
      if (user.photographer.status !== 'approved') {
        console.debug('[auth/login] photographer pending approval for user:', user.id, 'status:', user.photographer.status)
        return NextResponse.json(
          { error: 'Account pending approval' },
          { status: 401 }
        )
      }
    }

  // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'photographer' | 'client' | 'admin',
      photographerId: user.photographer?.id,
      permissions: {
        canView: true,
        canFavorite: true,
        canComment: true,
        canDownload: user.role === 'photographer' || user.role === 'admin',
        canRequestPurchase: true
      }
    }

    const token = generateToken(tokenPayload)

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photographerId: user.photographer?.id
      }
    })

    // Debugging: surface non-sensitive info to help diagnose production 401s
    try {
      console.debug('[auth/login] successful login for email:', user.email, 'id:', user.id, 'role:', user.role)
    } catch (e) {
      /* ignore logging errors */
    }

    // Set HTTP-only cookie (explicit path) so browsers include it for subsequent requests
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Also set a 'Set-Cookie' header fallback string. Use SameSite=None for cross-site use and allow domain override via COOKIE_DOMAIN.
    try {
      const maxAge = 60 * 60 * 24 * 7
      const parts: string[] = []
      parts.push(`auth-token=${token}`)
      parts.push('HttpOnly')
      parts.push('Path=/')
      parts.push(`Max-Age=${maxAge}`)
      // Allow cross-site cookie (needed if your app uses different subdomains or CDNs)
      parts.push('SameSite=None')
      if (process.env.NODE_ENV === 'production') parts.push('Secure')
      if (process.env.COOKIE_DOMAIN) parts.push(`Domain=${process.env.COOKIE_DOMAIN}`)

      const setCookie = parts.join('; ')
      response.headers.set('Set-Cookie', setCookie)
    } catch (e) {
      /* ignore header set errors */
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}