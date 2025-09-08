import { NextRequest, NextResponse } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = paramsSchema.parse(resolvedParams)
    const password = request.headers.get('X-Gallery-Password')

    // Find the gallery
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findUnique({
        where: { id },
        include: {
          photos: {
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: {
                  photoFavorites: true,
                  photoDownloads: true,
                },
              },
            },
          },
          photographer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              photos: true,
              invites: true,
            },
          },
        },
      }))
    } catch (dbErr) {
      console.error('DB error fetching public gallery in GET /api/gallery/[id]/public:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check if gallery is accessible
    if (gallery.status !== 'active') {
      return NextResponse.json(
        { error: 'Gallery is not available' },
        { status: 404 }
      )
    }

    // Check if gallery has expired
    if (gallery.expiresAt && new Date() > gallery.expiresAt) {
      return NextResponse.json(
        { error: 'Gallery has expired' },
        { status: 410 }
      )
    }

    // Check password if required
    if (gallery.requirePassword) {
      if (!password || password !== gallery.password) {
        return NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        )
      }
    }

    // Increment view count (best-effort)
    try {
      await withPrismaRetry(() => prisma.gallery.update({ where: { id }, data: { views: { increment: 1 } } }))
    } catch (dbErr) {
      console.error('DB error incrementing gallery views in GET /api/gallery/[id]/public:', dbErr)
    }

    // Format response
    const response = {
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      status: gallery.status,
      createdAt: gallery.createdAt.toISOString(),
      expiresAt: gallery.expiresAt?.toISOString(),
      isPublic: gallery.isPublic,
      allowDownloads: gallery.allowDownloads,
      requirePassword: gallery.requirePassword,
      totalPhotos: gallery._count.photos,
      views: gallery.views + 1, // Include the increment
      photographer: {
        name: gallery.photographer.user.name,
        businessName: gallery.photographer.businessName,
      },
      photos: gallery.photos.map(photo => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        createdAt: photo.createdAt.toISOString(),
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        favorites: photo._count.photoFavorites,
        downloads: photo._count.photoDownloads,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching public gallery:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}