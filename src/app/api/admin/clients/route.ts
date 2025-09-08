export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
  const payload = getUserFromRequest(request)

  if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const photographerId = searchParams.get('photographerId')
    const skip = (page - 1) * limit

    const where = photographerId ? { invitedBy: photographerId } : {}

    try {
      const [clients, total] = await withPrismaRetry(() =>
        Promise.all([
          prisma.client.findMany({
            where,
            skip,
            take: limit,
            include: {
              user: { select: { id: true, email: true, name: true } },
              photographer: { include: { user: { select: { name: true, email: true } } } },
              clientInvites: { include: { invite: { select: { inviteCode: true, type: true, status: true, createdAt: true } } } },
              favorites: { select: { id: true } },
              comments: { select: { id: true } },
              purchaseRequests: { select: { id: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.client.count({ where })
        ])
      )

      // Get last activity for each client
      const clientsWithActivity = await withPrismaRetry(() =>
        Promise.all(
          clients.map(async (client) => {
            const lastActivity = await prisma.analytics.findFirst({ where: { clientId: client.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, type: true } })

            return {
              ...client,
              lastActivity: lastActivity?.createdAt || client.createdAt,
              lastActivityType: lastActivity?.type || 'registration',
              stats: { favorites: client.favorites.length, comments: client.comments.length, purchaseRequests: client.purchaseRequests.length, invites: client.clientInvites.length }
            }
          })
        )
      )

      return NextResponse.json({ clients: clientsWithActivity, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
    } catch (dbErr) {
      console.error('DB error fetching clients:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
  const payload = getUserFromRequest(request)

  if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get client with user info
    try {
      const client = await withPrismaRetry(() => prisma.client.findUnique({ where: { id: clientId }, include: { user: true } }))

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      await withPrismaRetry(() => prisma.$transaction([
        prisma.favorite.deleteMany({ where: { clientId } }),
        prisma.comment.deleteMany({ where: { clientId } }),
        prisma.purchaseRequest.deleteMany({ where: { clientId } }),
        prisma.analytics.deleteMany({ where: { clientId } }),
        prisma.client.delete({ where: { id: clientId } }),
        prisma.user.delete({ where: { id: client.userId } })
      ]))

      await withPrismaRetry(() => prisma.analytics.create({ data: { type: 'admin_action', metadata: { action: 'client_deleted', clientId, adminId: payload.userId, timestamp: new Date().toISOString() } } }))

      return NextResponse.json({ message: 'Client deleted successfully' })
    } catch (dbErr) {
      console.error('DB error deleting client:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}