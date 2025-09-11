import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GalleryStatus } from '@prisma/client'
import { z } from 'zod'

const createGallerySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: {
      photographerId: string
      status?: GalleryStatus
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      photographerId: session.user.photographerId,
    }

    if (status && status !== 'all' && (status === 'draft' || status === 'active' || status === 'archived')) {
      where.status = status as GalleryStatus
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [galleries, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        include: {
          _count: {
          select: {
            photos: true,
            invites: true,
          },
        },
          photos: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { url: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gallery.count({ where }),
    ])

    const formattedGalleries = await Promise.all(galleries.map(async (gallery: any) => {
      // Get all photos for each gallery
      const galleryWithPhotos = await prisma.gallery.findUnique({
        where: { id: gallery.id },
        include: {
          photos: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              thumbnailUrl: true,
              price: true,
              isForSale: true,
              tags: true,
              category: true,
              location: true,
              artistStatement: true,
              exhibitionHistory: true,
              certificateId: true,
              _count: {
                select: {
                  favorites: true,
                  photoFavorites: true,
                  photoDownloads: true,
                }
              }
            }
          }
        }
      })

      return {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        status: gallery.status,
        createdAt: gallery.createdAt,
        isPublic: gallery.isPublic,
        totalPhotos: gallery._count.photos,
        views: gallery.views,
        invites: gallery._count.invites,
        thumbnail: gallery.photos[0]?.url || null,
          photos: galleryWithPhotos?.photos.map((photo: any) => ({
          ...photo,
          tags: photo.tags ? JSON.parse(photo.tags as string) : [],
          favorites: photo._count.favorites,
          views: photo._count.photoFavorites || 0,
          downloads: photo._count.photoDownloads || 0,
        })) || []
      }
    }))

    return NextResponse.json({
      galleries: formattedGalleries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching galleries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createGallerySchema.parse(body)

    const gallery = await prisma.gallery.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        photographerId: session.user.photographerId,
        status: 'active'
      },
      include: {
        _count: {
          select: {
            photos: true,
            invites: true
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
      isPublic: gallery.isPublic,
      totalPhotos: gallery._count.photos,
      views: gallery.views,
      invites: gallery._count.invites,
      thumbnail: null
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}