export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)

    if (!payload?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wishlist
    let user
    try {
      user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email: payload.email }, include: { wishlist: { include: { photo: { include: { gallery: { include: { photographer: { select: { id: true, name: true, user: { select: { email: true } } } } } } } } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching wishlist user in GET /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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
    const payload = getUserFromRequest(request)

    if (!payload?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photoId } = await request.json()
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get user
    let user
    try {
      user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email: payload.email } }))
    } catch (dbErr) {
      console.error('DB error fetching user in POST /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if photo exists
    let photo
    try {
      photo = await withPrismaRetry(() => prisma.photo.findUnique({ where: { id: photoId } }))
    } catch (dbErr) {
      console.error('DB error fetching photo in POST /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check if already in wishlist
    let existingWishlistItem
    try {
      existingWishlistItem = await withPrismaRetry(() => prisma.wishlistItem.findUnique({ where: { userId_photoId: { userId: user.id, photoId: photoId } } }))
    } catch (dbErr) {
      console.error('DB error checking wishlist item in POST /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (existingWishlistItem) {
      return NextResponse.json({ error: 'Photo already in wishlist' }, { status: 400 })
    }

    // Add to wishlist
    let wishlistItem
    try {
      wishlistItem = await withPrismaRetry(() => prisma.wishlistItem.create({ data: { userId: user.id, photoId: photoId } }))
    } catch (dbErr) {
      console.error('DB error creating wishlist item in POST /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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
    const payload = getUserFromRequest(request)

    if (!payload?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Get user
    let user
    try {
      user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email: payload.email } }))
    } catch (dbErr) {
      console.error('DB error fetching user in DELETE /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove from wishlist
    let deletedItem
    try {
      deletedItem = await withPrismaRetry(() => prisma.wishlistItem.deleteMany({ where: { userId: user.id, photoId: photoId } }))
    } catch (dbErr) {
      console.error('DB error deleting wishlist item in DELETE /api/wishlist:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (deletedItem.count === 0) {
      return NextResponse.json({ error: 'Photo not found in wishlist' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Photo removed from wishlist' })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}