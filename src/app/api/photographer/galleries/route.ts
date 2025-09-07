import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { GalleryStatus } from '@prisma/client'
import { z } from 'zod'

const createGallerySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowDownloads: z.boolean().default(true),
  requirePassword: z.boolean().default(false),
  password: z.string().optional(),
  visibility: z.enum(['private', 'invite_only', 'public']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)

    if (!payload?.photographerId) {
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
      photographerId: payload.photographerId,
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

    const formattedGalleries = galleries.map(gallery => ({
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      status: gallery.status,
      createdAt: gallery.createdAt,
      expiresAt: gallery.expiresAt,
      isPublic: gallery.isPublic,
      allowDownloads: gallery.allowDownloads,
      totalPhotos: gallery._count.photos,
      views: gallery.views,
      invites: gallery._count.invites,
      thumbnail: gallery.photos[0]?.url || null,
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
    const payload = getUserFromRequest(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createGallerySchema.parse(body)

    const gallery = await prisma.gallery.create({
      data: {
        ...validatedData,
  photographerId: payload.photographerId,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        status: 'active',
        visibility: validatedData.visibility || (validatedData.isPublic ? 'public' : 'private'),
      },
      include: {
        _count: {
          select: {
            photos: true,
            collections: true,
            invites: true,
            analytics: true,
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
      totalPhotos: gallery._count.photos,
      views: gallery.views,
      favorites: 0,
      invites: gallery._count.invites,
      thumbnail: null,
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