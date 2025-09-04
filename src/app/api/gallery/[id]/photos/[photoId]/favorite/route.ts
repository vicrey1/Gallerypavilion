import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: galleryId, photoId } = paramsSchema.parse(resolvedParams)
    
    // Parse request body for additional context
    let requestBody = {}
    try {
      requestBody = await request.json()
    } catch {
      // Body is optional, continue without it
    }
    
    // Get client IP for tracking favorites
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Verify the photo belongs to the gallery and gallery is accessible
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        galleryId,
        gallery: {
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found or gallery not accessible' },
        { status: 404 }
      )
    }

    // Check if this IP has already favorited this photo
    const existingFavorite = await prisma.photoFavorite.findUnique({
      where: {
        photoId_clientIp: {
          photoId,
          clientIp,
        },
      },
    })

    let action: 'added' | 'removed'
    
    if (existingFavorite) {
      // Remove favorite
      await prisma.photoFavorite.delete({
        where: {
          photoId_clientIp: {
            photoId,
            clientIp,
          },
        },
      })
      action = 'removed'
    } else {
      // Add favorite
      await prisma.photoFavorite.create({
        data: {
          photoId,
          clientIp,
        },
      })
      action = 'added'
    }

    // Get updated favorite count
    const favoriteCount = await prisma.photoFavorite.count({
      where: { photoId },
    })

    return NextResponse.json({
      success: true,
      action,
      favoriteCount,
      isFavorited: action === 'added',
      photoId,
    })
  } catch (error) {
    console.error('Error toggling photo favorite:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}