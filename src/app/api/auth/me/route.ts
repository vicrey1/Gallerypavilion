import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
  const user = await getUserFromRequestAsync(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        photographer: true,
        client: true
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        photographerId: dbUser.photographer?.id,
        clientId: dbUser.client?.id,
  status: dbUser.photographer?.status || null,
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}