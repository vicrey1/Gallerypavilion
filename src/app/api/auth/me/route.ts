import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Debug: surface header and cookie-name info to help diagnose 401s in production
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookieNames = cookieHeader
        .split(';')
        .map(c => c.split('=')[0].trim())
        .filter(Boolean)
      console.debug('[api/auth/me] headers:', { hasAuthHeader: !!request.headers.get('authorization'), cookieNames })
    } catch (e) {
      console.debug('[api/auth/me] header debug failed')
    }
  const user = await getUserFromRequestAsync(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get fresh user data from database (with retry for transient DB errors)
    let dbUser
    try {
      dbUser = await withPrismaRetry(() => prisma.user.findUnique({ where: { id: user.userId }, include: { photographer: true, client: true } }))
    } catch (dbErr) {
      console.error('DB error in /api/auth/me:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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