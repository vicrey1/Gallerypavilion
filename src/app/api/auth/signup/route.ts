import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['photographer']).default('photographer')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = signupSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name, type } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and photographer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role: 'photographer'
        }
      })

      // Create photographer profile
      const photographer = await tx.photographer.create({
        data: {
          userId: user.id,
          name: user.name || '',
          status: 'pending' // Requires admin approval
        }
      })

      return { user, photographer }
    })

    // Generate JWT token (even for pending photographers)
    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: 'photographer' as const,
      photographerId: result.photographer.id,
      permissions: {
        canView: true,
        canFavorite: true,
        canComment: true,
        canDownload: false, // Limited until approved
        canRequestPurchase: true
      }
    }

    const token = generateToken(tokenPayload)

  const isProd = process.env.NODE_ENV === 'production'
  const maxAge = 60 * 60 * 24 * 7
  const response = NextResponse.json({
    success: true,
    message: 'Account created successfully. Pending admin approval.',
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      photographerId: result.photographer.id,
      status: result.photographer.status
    }
  }, { status: 200 })

  try {
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge
    })
  } catch (e) {
    /* ignore */
  }

  try {
    const parts: string[] = []
    parts.push(`auth-token=${token}`)
    parts.push('HttpOnly')
    parts.push('Path=/')
    parts.push(`Max-Age=${maxAge}`)
    parts.push(isProd ? 'SameSite=None' : 'SameSite=Lax')
    if (isProd) parts.push('Secure')
    if (process.env.COOKIE_DOMAIN) parts.push(`Domain=${process.env.COOKIE_DOMAIN}`)
    response.headers.set('Set-Cookie', parts.join('; '))
  } catch (e) {
    /* ignore */
  }

  return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}