import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get recent activities from various sources
    const activities: Array<{
      id: string
      type: string
      title: string
      description: string
      timestamp: Date
      status: string
      metadata?: Record<string, string | number | boolean | null>
    }> = []

    // Recent photographer registrations
    const recentPhotographers = await prisma.photographer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    recentPhotographers.forEach((photographer: {
      id: string
      status: string
      createdAt: Date
      user: {
        name: string | null
        email: string
      }
    }) => {
      activities.push({
        id: `photographer-${photographer.id}`,
        type: 'photographer_registration',
        title: 'New photographer registration',
        description: `${photographer.user.name || photographer.user.email} registered as a photographer`,
        timestamp: photographer.createdAt,
        status: photographer.status,
        metadata: {
          photographerId: photographer.id,
          photographerName: photographer.user.name,
          photographerEmail: photographer.user.email
        }
      })
    })

    // Recent galleries
    const recentGalleries = await prisma.gallery.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        photographer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    recentGalleries.forEach((gallery: {
      id: string
      title: string
      status: string
      createdAt: Date
      photographer: {
        id: string
        user: {
          name: string | null
          email: string
        }
      }
    }) => {
      activities.push({
        id: `gallery-${gallery.id}`,
        type: 'gallery_created',
        title: 'New gallery created',
        description: `${gallery.photographer.user.name || gallery.photographer.user.email} created gallery "${gallery.title}"`,
        timestamp: gallery.createdAt,
        status: gallery.status,
        metadata: {
          galleryId: gallery.id,
          galleryTitle: gallery.title,
          photographerId: gallery.photographer.id,
          photographerName: gallery.photographer.user.name
        }
      })
    })

    // Recent clients
    const recentClients = await prisma.client.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        photographer: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    recentClients.forEach((client: {
      id: string
      createdAt: Date
      user: {
        name: string | null
        email: string
      }
      photographer: {
        id: string
        user: {
          name: string | null
        }
      }
    }) => {
      activities.push({
        id: `client-${client.id}`,
        type: 'client_registration',
        title: 'New client registered',
        description: `${client.user.name || client.user.email} was invited by ${client.photographer.user.name}`,
        timestamp: client.createdAt,
        status: 'active',
        metadata: {
          clientId: client.id,
          clientName: client.user.name,
          clientEmail: client.user.email,
          photographerId: client.photographer.id,
          photographerName: client.photographer.user.name
        }
      })
    })

    // Recent purchase requests
    const recentPurchases = await prisma.purchaseRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        photo: {
          select: { id: true, title: true, filename: true }
        }
      }
    })

    recentPurchases.forEach((purchase: {
      id: string
      createdAt: Date
      status: string
      licenseType: string
      price: number | null
      client: {
        id: string
        user: {
          name: string | null
          email: string
        }
      }
      photo: {
        id: string
        title: string | null
        filename: string
      }
    }) => {
      activities.push({
        id: `purchase-${purchase.id}`,
        type: 'purchase_request',
        title: 'New purchase request',
        description: `${purchase.client.user.name || purchase.client.user.email} requested to purchase "${purchase.photo.title || purchase.photo.filename}"`,
        timestamp: purchase.createdAt,
        status: purchase.status,
        metadata: {
          purchaseId: purchase.id,
          clientId: purchase.client.id,
          clientName: purchase.client.user.name,
          photoId: purchase.photo.id,
          photoTitle: purchase.photo.title,
          licenseType: purchase.licenseType,
          price: purchase.price
        }
      })
    })

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit)

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length
    })

  } catch (error) {
    console.error('Error fetching admin activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}