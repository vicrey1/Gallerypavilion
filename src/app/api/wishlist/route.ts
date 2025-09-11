import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wishlist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wishlist: {
          include: {
            photo: {
              include: {
                gallery: {
                  include: {
                    photographer: {
                      select: {
                        id: true,
                        name: true,
                        user: {
                          select: {
                            email: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wishlistPhotos = user.wishlist.map(item => ({
      id: item.photo.id,
      title: item.photo.title,
      description: item.photo.description,
      url: item.photo.url,
      thumbnailUrl: item.photo.thumbnailUrl,
      price: item.photo.price,
      isForSale: item.photo.isForSale,
      addedAt: item.createdAt,
      gallery: {
        id: item.photo.gallery.id,
        title: item.photo.gallery.title,
        photographer: item.photo.gallery.photographer
      }
    }))

    return NextResponse.json({ wishlist: wishlistPhotos })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photoId } = await request.json()
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if photo exists
    const photo = await prisma.photo.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check if already in wishlist
    const existingWishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_photoId: {
          userId: user.id,
          photoId: photoId
        }
      }
    })

    if (existingWishlistItem) {
      return NextResponse.json({ error: 'Photo already in wishlist' }, { status: 400 })
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        photoId: photoId
      }
    })

    return NextResponse.json({ 
      message: 'Photo added to wishlist',
      wishlistItem: {
        id: wishlistItem.id,
        photoId: wishlistItem.photoId,
        addedAt: wishlistItem.createdAt
      }
    })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove from wishlist
    const deletedItem = await prisma.wishlistItem.deleteMany({
      where: {
        userId: user.id,
        photoId: photoId
      }
    })

    if (deletedItem.count === 0) {
      return NextResponse.json({ error: 'Photo not found in wishlist' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Photo removed from wishlist' })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}