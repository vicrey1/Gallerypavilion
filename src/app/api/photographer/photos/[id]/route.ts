import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { unlink } from 'fs/promises'
import { join } from 'path'

const updatePhotoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  isForSale: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  editionNumber: z.string().optional(),
  editionSize: z.number().min(1).optional(),
  medium: z.string().optional(),
  printingTechnique: z.string().optional(),
  paperType: z.string().optional(),
  artistStatement: z.string().optional(),
  exhibitionHistory: z.string().optional(),
  certificateId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updatePhotoSchema.parse(body)
    
    // Convert tags array to JSON for database storage
    const dataToUpdate = {
      ...validatedData,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
    }

    // Check if photo exists and belongs to photographer's gallery
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id: id,
        gallery: {
          photographerId: session.user.photographerId,
        },
      },
      include: {
        gallery: true,
      },
    })

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    const photo = await prisma.photo.update({
      where: { id: id },
      data: dataToUpdate,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        createdAt: true,
        fileSize: true,
        width: true,
        height: true,
        mimeType: true,
        price: true,
        isForSale: true,
        tags: true,
        category: true,
        location: true,
        certificateId: true,
        galleryId: true,
      },
    })

        // Fetch the gallery to ensure the photo is still associated
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: photo.galleryId,
        photographerId: session.user.photographerId,
      },
      include: {
        photos: {
          where: {
            id: photo.id
          }
        }
      }
    })

    if (!gallery || gallery.photos.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found in gallery' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...photo,
      tags: photo.tags ? JSON.parse(photo.tags as string) : [],
      favorites: 0,
      views: 0,
      downloads: 0,
      galleryId: photo.galleryId // Include this to help client-side state management
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating photo:', error)
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
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    // Check if photo exists and belongs to photographer's gallery
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id: id,
        gallery: {
          photographerId: session.user.photographerId,
        },
      },
    })

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete photo files from filesystem
    try {
      const photoPath = join(process.cwd(), 'public', existingPhoto.url)
      const thumbnailPath = join(process.cwd(), 'public', existingPhoto.thumbnailUrl)
      
      await Promise.all([
        unlink(photoPath).catch(() => {}), // Ignore errors if file doesn't exist
        unlink(thumbnailPath).catch(() => {}),
      ])
    } catch (error) {
      console.warn('Error deleting photo files:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete photo record from database
    await prisma.photo.delete({
      where: { id: id },
    })

    return NextResponse.json(
      { message: 'Photo deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: id,
        gallery: {
          photographerId: session.user.photographerId,
        },
      },
      include: {
        gallery: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            photoFavorites: true,
            photoDownloads: true,
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      createdAt: photo.createdAt,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      favorites: photo._count.favorites + photo._count.photoFavorites,
      downloads: photo._count.photoDownloads,
      gallery: photo.gallery,
    })
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}