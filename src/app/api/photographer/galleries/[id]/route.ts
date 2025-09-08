export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { z } from 'zod'

const updateGallerySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  allowDownloads: z.boolean().optional(),
  requirePassword: z.boolean().optional(),
  password: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
  const payload = await getUserFromRequestAsync(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: id, photographerId: payload.photographerId }, include: {
        photographer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
        photos: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            title: true,
            description: true,
            createdAt: true,
            fileSize: true,
            mimeType: true,
            price: true,
            isForSale: true,
            tags: true,
            category: true,
            location: true,
            _count: {
              select: {
                favorites: true,
                photoFavorites: true,
                photoDownloads: true,
              },
            },
          },
        },
        invites: {
          include: {
            clientInvites: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } }))
      } catch (dbErr) {
        console.error('DB error fetching gallery in GET /api/photographer/galleries/[id]:', dbErr)
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      }

      if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      status: gallery.status,
      createdAt: gallery.createdAt,
      expiresAt: gallery.expiresAt,
      isPublic: gallery.isPublic,
      allowDownloads: gallery.allowDownloads,
      requirePassword: gallery.requirePassword,
      totalPhotos: gallery._count.photos,
      views: gallery.views || 0,
      favorites: 0, // Will be calculated from analytics if needed
      invites: gallery._count.invites,
      photographer: {
        id: gallery.photographer.user.id,
        name: gallery.photographer.user.name,
        email: gallery.photographer.user.email,
      },
      photos: gallery.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        title: photo.title,
        description: photo.description,
        createdAt: photo.createdAt,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        price: photo.price,
        isForSale: photo.isForSale,
        tags: photo.tags ? JSON.parse(photo.tags as string) : [],
        category: photo.category,
        location: photo.location,
        favorites: photo._count.favorites + photo._count.photoFavorites,
        downloads: photo._count.photoDownloads,
      })),
      invitedUsers: gallery.invites.flatMap(invite => 
        invite.clientInvites.map(clientInvite => ({
          id: clientInvite.id,
          email: clientInvite.client.user.email,
          status: invite.status,
          invitedAt: clientInvite.createdAt,
        }))
      ),
    })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
  const payload = await getUserFromRequestAsync(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateGallerySchema.parse(body)

    // Find the gallery to ensure it belongs to the photographer
    console.log('DELETE Gallery - Session user:', {
      userId: payload.userId,
      photographerId: payload.photographerId,
      role: payload.role
    })
    console.log('DELETE Gallery - Gallery ID:', id)
    
    let existingGallery
    try {
      existingGallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: id, photographerId: payload.photographerId } }))
    } catch (dbErr) {
      console.error('DB error checking existing gallery in /api/photographer/galleries/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
    
    console.log('DELETE Gallery - Found gallery:', existingGallery)
    
    // Check if gallery exists at all
    let anyGallery
    try {
      anyGallery = await withPrismaRetry(() => prisma.gallery.findUnique({ where: { id: id } }))
    } catch (dbErr) {
      console.error('DB error checking any gallery in /api/photographer/galleries/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
    console.log('DELETE Gallery - Any gallery with this ID:', anyGallery)

  if (!existingGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    const updateData: {
      title?: string
      description?: string
      expiresAt?: Date | null
      isPublic?: boolean
      allowDownloads?: boolean
      requirePassword?: boolean
      password?: string
      status?: 'draft' | 'active' | 'archived'
    } = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic
    if (validatedData.allowDownloads !== undefined) updateData.allowDownloads = validatedData.allowDownloads
    if (validatedData.requirePassword !== undefined) updateData.requirePassword = validatedData.requirePassword
    if (validatedData.password !== undefined) updateData.password = validatedData.password
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
    }

    let updatedGallery
    try {
      updatedGallery = await withPrismaRetry(() => prisma.gallery.update({ where: { id: id }, data: updateData, include: { _count: { select: { photos: true, invites: true } } } }))
    } catch (dbErr) {
      console.error('DB error updating gallery in /api/photographer/galleries/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      id: updatedGallery.id,
      title: updatedGallery.title,
      description: updatedGallery.description,
      status: updatedGallery.status,
      createdAt: updatedGallery.createdAt,
      expiresAt: updatedGallery.expiresAt,
      isPublic: updatedGallery.isPublic,
      allowDownloads: updatedGallery.allowDownloads,
      requirePassword: updatedGallery.requirePassword,
      totalPhotos: updatedGallery._count.photos,
      views: updatedGallery.views,
      invites: updatedGallery._count.invites,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
  const payload = await getUserFromRequestAsync(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    // Check if gallery exists and belongs to photographer
    let existingGalleryDelete
    try {
      existingGalleryDelete = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: id, photographerId: payload.photographerId } }))
    } catch (dbErr) {
      console.error('DB error checking existing gallery before delete in /api/photographer/galleries/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!existingGalleryDelete) {
      // Check if gallery exists at all to provide better error message
      let anyGalleryDelete
      try {
        anyGalleryDelete = await withPrismaRetry(() => prisma.gallery.findUnique({ where: { id: id } }))
      } catch (dbErr) {
        console.error('DB error checking any gallery before delete in /api/photographer/galleries/[id]:', dbErr)
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      }
      
      if (!anyGalleryDelete) {
        return NextResponse.json(
          { error: 'Gallery not found' },
          { status: 404 }
        )
      } else {
        return NextResponse.json(
          { error: 'You do not have permission to delete this gallery' },
          { status: 403 }
        )
      }
    }

    // Delete gallery and all related data (photos, views, favorites, etc.)
    try {
      await withPrismaRetry(() => prisma.gallery.delete({ where: { id: id } }))
    } catch (dbErr) {
      console.error('DB error deleting gallery in /api/photographer/galleries/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json(
      { message: 'Gallery deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}