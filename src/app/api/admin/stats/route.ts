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

    // Fetch statistics from database
    const [photographers, clients, galleries, photos, pendingPhotographers, activeInvites, analytics] = await Promise.all([
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
          status: 'active'
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

    // Get recent analytics for trends, defaulting to 0 if no data
    const [recentViews, recentDownloads, totalViews, totalDownloads] = await Promise.all([
      // Recent views (last 24 hours)
      prisma.analytics.count({
        where: {
          type: 'gallery_access',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),

      // Recent downloads (last 24 hours)
      prisma.analytics.count({
        where: {
          type: 'photo_download',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),

      // Total views
      prisma.analytics.count({
        where: {
          type: {
            in: ['gallery_access', 'photo_view']
          }
        }
      }).catch(() => 0),

      // Total downloads
      prisma.analytics.count({
        where: {
          type: 'photo_download'
        }
      }).catch(() => 0)
    ])

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