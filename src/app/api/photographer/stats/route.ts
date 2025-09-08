export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const photographerId = payload.photographerId

    // Get basic statistics
    let totalGalleries, activeGalleries, totalPhotos, totalViews, totalFavorites, totalDownloads
    try {
      [totalGalleries, activeGalleries, totalPhotos, totalViews, totalFavorites, totalDownloads] = await Promise.all([
        withPrismaRetry(() => prisma.gallery.count({ where: { photographerId } })),
        withPrismaRetry(() => prisma.gallery.count({ where: { photographerId, status: 'active' } })),
        withPrismaRetry(() => prisma.photo.count({ where: { gallery: { photographerId } } })),
        withPrismaRetry(() => prisma.analytics.count({ where: { type: 'gallery_view', gallery: { photographerId } } })),
        withPrismaRetry(() => prisma.photoFavorite.count({ where: { photo: { gallery: { photographerId } } } })),
        withPrismaRetry(() => prisma.photoDownload.count({ where: { photo: { gallery: { photographerId } } } })),
      ])
    } catch (dbErr) {
      console.error('DB error fetching photographer stats in GET /api/photographer/stats:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Get recent activity
    let recentViews
    try {
      recentViews = await withPrismaRetry(() => prisma.analytics.findMany({ where: { type: 'gallery_view', gallery: { photographerId } }, include: { gallery: { select: { title: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }))
    } catch (dbErr) {
      console.error('DB error fetching recent views in GET /api/photographer/stats:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    let recentFavorites
    try {
      recentFavorites = await withPrismaRetry(() => prisma.photoFavorite.findMany({ where: { photo: { gallery: { photographerId } } }, include: { photo: { select: { gallery: { select: { title: true } } } } }, orderBy: { createdAt: 'desc' }, take: 5 }))
    } catch (dbErr) {
      console.error('DB error fetching recent favorites in GET /api/photographer/stats:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    let recentDownloads
    try {
      recentDownloads = await withPrismaRetry(() => prisma.photoDownload.findMany({ where: { photo: { gallery: { photographerId } } }, include: { photo: { select: { gallery: { select: { title: true } } } } }, orderBy: { createdAt: 'desc' }, take: 5 }))
    } catch (dbErr) {
      console.error('DB error fetching recent downloads in GET /api/photographer/stats:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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
    let monthlyStats
    try {
      monthlyStats = await withPrismaRetry(() => prisma.analytics.groupBy({ by: ['createdAt'], where: { type: 'gallery_view', gallery: { photographerId }, createdAt: { gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) } }, _count: { id: true } }))
    } catch (dbErr) {
      console.error('DB error fetching monthly stats in GET /api/photographer/stats:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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