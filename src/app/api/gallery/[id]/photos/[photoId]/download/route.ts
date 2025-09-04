import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const paramsSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: galleryId, photoId } = paramsSchema.parse(resolvedParams)
    
    // Get client IP for tracking downloads
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Verify the photo belongs to the gallery and gallery allows downloads
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        galleryId,
        gallery: {
          status: 'active',
          allowDownloads: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
      include: {
        gallery: {
          select: {
            allowDownloads: true,
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found, gallery not accessible, or downloads not allowed' },
        { status: 404 }
      )
    }

    if (!photo.gallery.allowDownloads) {
      return NextResponse.json(
        { error: 'Downloads are not allowed for this gallery' },
        { status: 403 }
      )
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), 'public', photo.url)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Photo file not found' },
        { status: 404 }
      )
    }

    // Track download (avoid duplicate tracking for same IP within 1 minute)
    const recentDownload = await prisma.photoDownload.findFirst({
      where: {
        photoId,
        clientIp,
        createdAt: {
          gte: new Date(Date.now() - 60000), // 1 minute ago
        },
      },
    })

    if (!recentDownload) {
      await prisma.photoDownload.create({
        data: {
          photoId,
          clientIp,
        },
      })
    }

    // Read and return the file
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = `${photo.title}.${photo.mimeType.split('/')[1]}`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading photo:', error)
    
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