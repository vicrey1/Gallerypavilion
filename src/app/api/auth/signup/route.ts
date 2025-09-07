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

    const setCookie = `auth-token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

    return NextResponse.json({
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
    }, {
      status: 200,
      headers: {
        'Set-Cookie': setCookie
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}