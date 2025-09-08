export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { GalleryStatus, GalleryVisibility } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)

  if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const photographerId = searchParams.get('photographerId')
    const skip = (page - 1) * limit

    const where: {
      status?: GalleryStatus
      photographerId?: string
    } = {}
    if (status) where.status = status as GalleryStatus
    if (photographerId) where.photographerId = photographerId

    try {
      const [galleries, total] = await withPrismaRetry(() =>
        Promise.all([
          prisma.gallery.findMany({
            where,
            skip,
            take: limit,
            include: {
              photographer: { include: { user: { select: { name: true, email: true } } } },
              collections: { include: { photos: { select: { id: true, filename: true, thumbnailUrl: true }, take: 1 } }, take: 1 },
              invites: { select: { id: true, status: true } },
              _count: { select: { invites: true, collections: true, photos: true } }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.gallery.count({ where })
        ])
      )

      const galleriesWithStats = await withPrismaRetry(() =>
        Promise.all(
          galleries.map(async (gallery) => {
            const [viewCount, downloadCount] = await Promise.all([
              prisma.analytics.count({ where: { type: 'gallery_access', galleryId: gallery.id } }),
              prisma.analytics.count({ where: { type: 'photo_download', galleryId: gallery.id } })
            ])

            return { ...gallery, stats: { views: viewCount, downloads: downloadCount, photos: gallery._count.photos, invites: gallery._count.invites, collections: gallery._count.collections }, coverPhoto: gallery.collections[0]?.photos[0] || null }
          })
        )
      )

      return NextResponse.json({ galleries: galleriesWithStats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
    } catch (dbErr) {
      console.error('DB error fetching galleries:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error fetching galleries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { galleryId, action, status, visibility } = body

    if (!galleryId || !action) {
      return NextResponse.json(
        { error: 'Gallery ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: {
      status?: GalleryStatus
      visibility?: GalleryVisibility
    } = {}

    switch (action) {
      case 'archive':
        updateData = { status: 'archived' }
        break
      case 'activate':
        updateData = { status: 'active' }
        break
      case 'suspend':
        updateData = { status: 'archived' }
        break
      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          )
        }
        updateData = { status }
        break
      case 'update_visibility':
        if (!visibility) {
          return NextResponse.json(
            { error: 'Visibility is required for update_visibility action' },
            { status: 400 }
          )
        }
        updateData = { visibility }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    try {
      const gallery = await withPrismaRetry(() => prisma.gallery.update({ where: { id: galleryId }, data: updateData, include: { photographer: { include: { user: { select: { name: true, email: true } } } } } }))

      await withPrismaRetry(() => prisma.analytics.create({ data: { type: 'admin_action', metadata: { action: `gallery_${action}`, galleryId, adminId: payload.userId, timestamp: new Date().toISOString() } } }))

      return NextResponse.json({ message: `Gallery ${action} successful`, gallery })
    } catch (dbErr) {
      console.error('DB error updating gallery:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error updating gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('id')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    // Check if gallery exists
    try {
      const gallery = await withPrismaRetry(() => prisma.gallery.findUnique({ where: { id: galleryId }, include: { photos: true, collections: true } }))

      if (!gallery) {
        return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
      }

      await withPrismaRetry(() => prisma.$transaction([
        prisma.favorite.deleteMany({ where: { photo: { galleryId } } }),
        prisma.comment.deleteMany({ where: { photo: { galleryId } } }),
        prisma.purchaseRequest.deleteMany({ where: { photo: { galleryId } } }),
        prisma.analytics.deleteMany({ where: { OR: [{ metadata: { path: ['galleryId'], equals: galleryId } }, ...gallery.photos.map(photo => ({ metadata: { path: ['photoId'], equals: photo.id } }))] } }),
        prisma.photo.deleteMany({ where: { galleryId } }),
        prisma.collection.deleteMany({ where: { galleryId } }),
        prisma.invite.deleteMany({ where: { galleryId } }),
        prisma.gallery.delete({ where: { id: galleryId } })
      ]))

      await withPrismaRetry(() => prisma.analytics.create({ data: { type: 'admin_action', metadata: { action: 'gallery_deleted', galleryId, adminId: payload.userId, timestamp: new Date().toISOString() } } }))

      return NextResponse.json({ message: 'Gallery deleted successfully' })
    } catch (dbErr) {
      console.error('DB error deleting gallery:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}