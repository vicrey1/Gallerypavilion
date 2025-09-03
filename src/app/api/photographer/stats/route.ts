import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const photographerId = session.user.photographerId

    // Get basic statistics
    const [totalGalleries, activeGalleries, totalPhotos, totalViews, totalFavorites, totalDownloads] = await Promise.all([
      prisma.gallery.count({
        where: { photographerId },
      }),
      prisma.gallery.count({
        where: { 
          photographerId,
          status: 'active',
        },
      }),
      prisma.photo.count({
        where: {
          gallery: {
            photographerId,
          },
        },
      }),
      // Use Analytics model for view tracking
      prisma.analytics.count({
        where: {
          type: 'gallery_view',
          gallery: {
            photographerId,
          },
        },
      }),
      prisma.photoFavorite.count({
        where: {
          photo: {
            gallery: {
              photographerId,
            },
          },
        },
      }),
      prisma.photoDownload.count({
        where: {
          photo: {
            gallery: {
              photographerId,
            },
          },
        },
      }),
    ])

    // Get recent activity
    const recentViews = await prisma.analytics.findMany({
      where: {
        type: 'gallery_view',
        gallery: {
          photographerId,
        },
      },
      include: {
        gallery: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    const recentFavorites = await prisma.photoFavorite.findMany({
      where: {
        photo: {
          gallery: {
            photographerId,
          },
        },
      },
      include: {
        photo: {
          select: {
            gallery: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    const recentDownloads = await prisma.photoDownload.findMany({
      where: {
        photo: {
          gallery: {
            photographerId,
          },
        },
      },
      include: {
        photo: {
          select: {
            gallery: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    // Combine and format recent activity
    const recentActivity = [
      ...recentViews.map(view => ({
        type: 'view' as const,
        gallery: view.gallery?.title || 'Unknown Gallery',
        client: 'Anonymous',
        time: view.createdAt,
      })),
      ...recentFavorites.map(favorite => ({
        type: 'favorite' as const,
        gallery: favorite.photo.gallery.title,
        client: favorite.clientIp,
        time: favorite.createdAt,
      })),
      ...recentDownloads.map(download => ({
        type: 'download' as const,
        gallery: download.photo.gallery.title,
        client: download.clientIp,
        time: download.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        time: formatTimeAgo(activity.time),
      }))

    // Get monthly statistics for charts - simplified for SQLite
    const monthlyStats = await prisma.analytics.groupBy({
      by: ['createdAt'],
      where: {
        type: 'gallery_view',
        gallery: {
          photographerId,
        },
        createdAt: {
          gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 12 months ago
        },
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      totalGalleries,
      activeGalleries,
      totalPhotos,
      totalViews,
      totalFavorites,
      totalDownloads,
      recentActivity,
      monthlyViews: monthlyStats.map(stat => ({
        month: stat.createdAt,
        count: stat._count.id,
      })),
    })
  } catch (error) {
    console.error('Error fetching photographer stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}