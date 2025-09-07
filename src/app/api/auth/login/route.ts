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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        photographer: true,
        client: true
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check user role matches login type
    if (type === 'photographer' && user.role !== 'photographer') {
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

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}