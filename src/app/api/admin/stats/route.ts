export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
  // Allow optional debug details when explicitly enabled via env var.
  const url = new URL(request.url)
  const wantDebug = url.searchParams.get('debug') === 'true'
  const debugAllowed = wantDebug && process.env.STATS_DEBUG === 'true'

  const payload = await getUserFromRequestAsync(request)

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
      const msg = dbErr && dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.error('Error fetching admin stats (DB):', dbErr)
      const body: any = { error: 'Service temporarily unavailable' }
      if (debugAllowed) {
        body._debug = { dbError: msg }
      }
      return NextResponse.json(body, { status: 503 })
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