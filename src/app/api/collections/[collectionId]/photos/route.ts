import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/collections/[collectionId]/photos - Add photo to collection
export async function POST(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoId } = body

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the collection
    const collection = await prisma.collection.findFirst({
      where: {
        id: params.collectionId,
        userId: session.user.id
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      )
    }

    // Check if photo exists
    const photo = await prisma.photo.findUnique({
      where: {
        id: photoId
      }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Check if photo is already in collection
    const existingCollectionPhoto = await prisma.collectionPhoto.findUnique({
      where: {
        collectionId_photoId: {
          collectionId: params.collectionId,
          photoId: photoId
        }
      }
    })

    if (existingCollectionPhoto) {
      return NextResponse.json(
        { error: 'Photo is already in this collection' },
        { status: 409 }
      )
    }

    // Add photo to collection
    const collectionPhoto = await prisma.collectionPhoto.create({
      data: {
        collectionId: params.collectionId,
        photoId: photoId
      },
      include: {
        photo: {
          select: {
            id: true,
            title: true,
            filename: true,
            thumbnailUrl: true,
            price: true
          }
        }
      }
    })

    // Update collection's updatedAt timestamp
    await prisma.collection.update({
      where: {
        id: params.collectionId
      },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ collectionPhoto }, { status: 201 })
  } catch (error) {
    console.error('Error adding photo to collection:', error)
    return NextResponse.json(
      { error: 'Failed to add photo to collection' },
      { status: 500 }
    )
  }
}

// DELETE /api/collections/[collectionId]/photos - Remove photo from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the collection
    const collection = await prisma.collection.findFirst({
      where: {
        id: params.collectionId,
        userId: session.user.id
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      )
    }

    // Check if photo is in collection
    const collectionPhoto = await prisma.collectionPhoto.findUnique({
      where: {
        collectionId_photoId: {
          collectionId: params.collectionId,
          photoId: photoId
        }
      }
    })

    if (!collectionPhoto) {
      return NextResponse.json(
        { error: 'Photo not found in collection' },
        { status: 404 }
      )
    }

    // Remove photo from collection
    await prisma.collectionPhoto.delete({
      where: {
        collectionId_photoId: {
          collectionId: params.collectionId,
          photoId: photoId
        }
      }
    })

    // Update collection's updatedAt timestamp
    await prisma.collection.update({
      where: {
        id: params.collectionId
      },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing photo from collection:', error)
    return NextResponse.json(
      { error: 'Failed to remove photo from collection' },
      { status: 500 }
    )
  }
}