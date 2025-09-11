import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const gallery = await prisma.gallery.findFirst({
      where: {
        id: id,
        photographerId: session.user.photographerId,
      },
      include: {
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
            width: true,
            height: true,
            editionNumber: true,
            editionSize: true,
            medium: true,
            printingTechnique: true,
            paperType: true,
            artistStatement: true,
            exhibitionHistory: true,
            certificateId: true,
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
      },
    })

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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateGallerySchema.parse(body)

    // Find the gallery to ensure it belongs to the photographer
    console.log('DELETE Gallery - Session user:', {
      userId: session.user.id,
      photographerId: session.user.photographerId,
      role: session.user.role
    })
    console.log('DELETE Gallery - Gallery ID:', id)
    
    const existingGallery = await prisma.gallery.findFirst({
      where: {
        id: id,
        photographerId: session.user.photographerId,
      },
    })
    
    console.log('DELETE Gallery - Found gallery:', existingGallery)
    
    // Check if gallery exists at all
    const anyGallery = await prisma.gallery.findUnique({
      where: { id: id }
    })
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

    const gallery = await prisma.gallery.update({
      where: { id: id },
      data: updateData,
      include: {
        _count: {
          select: {
            photos: true,
            invites: true,
          },
        },
      },
    })

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
      views: gallery.views,
      invites: gallery._count.invites,
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    // Check if gallery exists and belongs to photographer
    const existingGallery = await prisma.gallery.findFirst({
      where: {
        id: id,
        photographerId: session.user.photographerId,
      },
    })

    if (!existingGallery) {
      // Check if gallery exists at all to provide better error message
      const anyGallery = await prisma.gallery.findUnique({
        where: { id: id }
      })
      
      if (!anyGallery) {
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
    await prisma.gallery.delete({
      where: { id: id },
    })

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