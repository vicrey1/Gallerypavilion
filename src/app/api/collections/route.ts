import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/collections - Get user's collections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includePhotos = searchParams.get('includePhotos') === 'true'

    const collections = await prisma.collection.findMany({
      where: {
        userId: session.user.id
      },
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
    })

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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
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

    const collection = await prisma.collection.create({
      data: {
        title: name.trim(),
        description: description?.trim() || null,
        isPrivate: !Boolean(isPublic),
        galleryId: galleryId,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            photos: true
          }
        }
      }
    })

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}