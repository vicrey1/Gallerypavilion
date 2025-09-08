export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'
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
  editionNumber: z.number().min(1).optional(),
  totalEditions: z.number().min(1).optional(),
  medium: z.string().optional(),
  technique: z.string().optional(),
  materials: z.string().optional(),
  artistStatement: z.string().optional(),
  provenance: z.string().optional(),
  certificateId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const payload = getUserFromRequest(request)

  if (!payload?.photographerId) {
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
    let existingPhoto
    try {
      existingPhoto = await withPrismaRetry(() => prisma.photo.findFirst({ where: { id: id, gallery: { photographerId: payload.photographerId } }, include: { gallery: true } }))
    } catch (dbErr) {
      console.error('DB error fetching existing photo in PUT /api/photographer/photos/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!existingPhoto) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    let photo
    try {
      photo = await withPrismaRetry(() => prisma.photo.update({ where: { id: id }, data: dataToUpdate, select: {
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
        editionNumber: true,
        totalEditions: true,
        medium: true,
        technique: true,
        materials: true,
        artistStatement: true,
        provenance: true,
        certificateId: true,
        _count: {
          select: {
            favorites: true,
            photoFavorites: true,
            photoDownloads: true,
          },
        },
      } }))

    } catch (dbErr) {
      console.error('DB error updating photo in PUT /api/photographer/photos/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      createdAt: photo.createdAt,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      mimeType: photo.mimeType,
      price: photo.price,
      isForSale: photo.isForSale,
      tags: photo.tags ? JSON.parse(photo.tags as string) : [],
      category: photo.category,
      location: photo.location,
      editionNumber: photo.editionNumber,
      totalEditions: photo.totalEditions,
      medium: photo.medium,
      technique: photo.technique,
      materials: photo.materials,
      artistStatement: photo.artistStatement,
      provenance: photo.provenance,
      certificateId: photo.certificateId,
      favorites: photo._count.favorites + photo._count.photoFavorites,
      downloads: photo._count.photoDownloads,
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
  const payload = getUserFromRequest(request)

  if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    // Check if photo exists and belongs to photographer's gallery
    let existingPhotoDelete
    try {
      existingPhotoDelete = await withPrismaRetry(() => prisma.photo.findFirst({ where: { id: id, gallery: { photographerId: payload.photographerId } } }))
    } catch (dbErr) {
      console.error('DB error fetching existing photo in DELETE /api/photographer/photos/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

  if (!existingPhotoDelete) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete photo files from filesystem
    try {
  const photoPath = join(process.cwd(), 'public', existingPhotoDelete.url)
  const thumbnailPath = join(process.cwd(), 'public', existingPhotoDelete.thumbnailUrl)
      
      await Promise.all([
        unlink(photoPath).catch(() => {}), // Ignore errors if file doesn't exist
        unlink(thumbnailPath).catch(() => {}),
      ])
    } catch (error) {
      console.warn('Error deleting photo files:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete photo record from database
    try {
      await withPrismaRetry(() => prisma.photo.delete({ where: { id: id } }))
    } catch (dbErr) {
      console.error('DB error deleting photo in DELETE /api/photographer/photos/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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
  const payload = getUserFromRequest(request)

  if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: id,
        gallery: {
          photographerId: payload.photographerId,
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