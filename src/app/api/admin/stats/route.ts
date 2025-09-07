import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
  const payload = getUserFromRequest(request)

  // Check if user is authenticated and has admin role
  if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch statistics from database
  const [photographers, clients, galleries, photos, pendingPhotographers, activeInvites, _analytics] = await Promise.all([
      // Total photographers
      prisma.photographer.count(),
      
      // Total clients
      prisma.client.count(),
      
      // Total galleries
      prisma.gallery.count(),
      
      // Total photos
      prisma.photo.count(),
      
      // Pending photographer approvals
      prisma.photographer.count({
        where: {
          status: 'pending'
        }
      }),
      
      // Active invites
      prisma.invite.count({
        where: {
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      
      // Analytics data for views and downloads
      prisma.analytics.aggregate({
        _count: {
          id: true
        },
        where: {
          type: {
            in: ['gallery_access', 'photo_view', 'photo_download']
          }
        }
      })
    ])

    // Get recent analytics for trends
    const recentViews = await prisma.analytics.count({
      where: {
        type: 'gallery_access',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    const recentDownloads = await prisma.analytics.count({
      where: {
        type: 'photo_download',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    const totalViews = await prisma.analytics.count({
      where: {
        type: {
          in: ['gallery_access', 'photo_view']
        }
      }
    })

    const totalDownloads = await prisma.analytics.count({
      where: {
        type: 'photo_download'
      }
    })

  const stats = {
      totalPhotographers: photographers,
      totalClients: clients,
      totalGalleries: galleries,
      totalPhotos: photos,
      pendingApprovals: pendingPhotographers,
      activeInvites: activeInvites,
      totalViews: totalViews,
      totalDownloads: totalDownloads,
      recentViews: recentViews,
      recentDownloads: recentDownloads
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}