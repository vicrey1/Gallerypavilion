export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

// GET /api/collections - Get user's collections
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includePhotos = searchParams.get('includePhotos') === 'true'

    let collections
    try {
      collections = await withPrismaRetry(() => prisma.collection.findMany({
        where: { userId: payload.userId },
        include: {
        photos: includePhotos ? {
          select: {
            id: true,
            title: true,
            filename: true,
            thumbnailUrl: true,
            price: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        } : false,
        _count: {
          select: {
            photos: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
      }))
    } catch (dbErr) {
      console.error('DB error fetching collections in GET /api/collections:', dbErr)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 503 })
    }

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPublic, galleryId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    let collection
    try {
      collection = await withPrismaRetry(() => prisma.collection.create({ data: { title: name.trim(), description: description?.trim() || null, isPrivate: !Boolean(isPublic), galleryId: galleryId, userId: payload.userId }, include: { _count: { select: { photos: true } } } }))
    } catch (dbErr) {
      console.error('DB error creating collection in POST /api/collections:', dbErr)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 503 })
    }

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}