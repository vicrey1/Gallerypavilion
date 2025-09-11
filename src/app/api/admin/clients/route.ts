import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
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

    const where = photographerId ? {
      invites: {
        some: {
          invite: {
            gallery: {
              photographerId
            }
          }
        }
      }
    } : {}

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          invites: {
            include: {
              invite: {
                include: {
                  gallery: {
                    include: {
                      photographer: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.client.count({ where })
    ])

    // Transform the data for response
    const formattedClients = clients.map(client => ({
      id: client.id,
      email: client.email,
      name: client.name,
      userId: client.userId,
      galleries: client.invites.map(invite => ({
        id: invite.invite.gallery.id,
        name: invite.invite.gallery.name,
        photographer: {
          id: invite.invite.gallery.photographer.id,
          name: invite.invite.gallery.photographer.name,
          email: invite.invite.gallery.photographer.email
        }
      })),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }))

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error in clients route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
