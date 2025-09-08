export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

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

    // Fetch statistics from database with transient retry
    let stats
    try {
      const result = await withPrismaRetry(async () => {
        const [photographers, clients, galleries, photos, pendingPhotographers, activeInvites, _analytics] = await Promise.all([
          prisma.photographer.count(),
          prisma.client.count(),
          prisma.gallery.count(),
          prisma.photo.count(),
          prisma.photographer.count({ where: { status: 'pending' } }),
          prisma.invite.count({ where: { status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
          prisma.analytics.aggregate({ _count: { id: true }, where: { type: { in: ['gallery_access', 'photo_view', 'photo_download'] } } })
        ])

        const [recentViews, recentDownloads, totalViews, totalDownloads] = await Promise.all([
          prisma.analytics.count({ where: { type: 'gallery_access', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
          prisma.analytics.count({ where: { type: 'photo_download', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
          prisma.analytics.count({ where: { type: { in: ['gallery_access', 'photo_view'] } } }),
          prisma.analytics.count({ where: { type: 'photo_download' } })
        ])

        return {
          totalPhotographers: photographers,
          totalClients: clients,
          totalGalleries: galleries,
          totalPhotos: photos,
          pendingApprovals: pendingPhotographers,
          activeInvites: activeInvites,
          totalViews,
          totalDownloads,
          recentViews,
          recentDownloads
        }
      })

      stats = result
    } catch (dbErr) {
      console.error('Error fetching admin stats (DB):', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
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