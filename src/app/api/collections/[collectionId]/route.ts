import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/collections/[collectionId] - Get a specific collection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        OR: [
          { userId: session.user.id },
          { isPrivate: false }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        photos: {
          include: {
            gallery: {
              select: {
                id: true,
                title: true,
                photographer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

// PUT /api/collections/[collectionId] - Update a collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { collectionId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPublic } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Check if user owns the collection
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.user.id
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      )
    }

    const collection = await prisma.collection.update({
      where: {
        id: collectionId
      },
      data: {
        title: name.trim(),
        description: description?.trim() || null,
        isPrivate: !Boolean(isPublic)
      },
      include: {
        _count: {
          select: {
            photos: true
          }
        }
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    )
  }
}

// DELETE /api/collections/[collectionId] - Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { collectionId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the collection
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.user.id
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.collection.delete({
      where: {
        id: collectionId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    )
  }
}