import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get recent activities from various sources
    const activities: Array<{
      id: string
      type: string
      title: string
      description: string
      timestamp: Date
      status: string
      metadata?: Record<string, string | number | boolean | null>
    }> = []

    // Recent photographer registrations
    const recentPhotographers = await prisma.photographer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    recentPhotographers.forEach(photographer => {
      activities.push({
        id: photographer.id,
        type: 'photographer_registration',
        title: 'New Photographer Registration',
        description: `${photographer.name} (${photographer.email}) registered as a photographer`,
        timestamp: photographer.createdAt,
        status: photographer.status,
        metadata: {
          photographerId: photographer.id,
          name: photographer.name,
          email: photographer.email
        }
      })
    })

    // Recent photo uploads
    const recentPhotos = await prisma.photo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        photographer: true,
        gallery: true
      }
    })

    recentPhotos.forEach(photo => {
      activities.push({
        id: photo.id,
        type: 'photo_upload',
        title: 'New Photo Upload',
        description: `${photo.photographer.name} uploaded "${photo.title}" to gallery "${photo.gallery?.name || 'Untitled'}"`,
        timestamp: photo.createdAt,
        status: photo.isPublic ? 'public' : 'private',
        metadata: {
          photoId: photo.id,
          photographerId: photo.photographerId,
          galleryId: photo.galleryId,
          photographerName: photo.photographer.name,
          galleryName: photo.gallery?.name ?? null
        }
      })
    })

    // Recent client invites
    const recentInvites = await prisma.invite.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        gallery: {
          include: {
            photographer: true
          }
        }
      }
    })

    recentInvites.forEach(invite => {
      activities.push({
        id: invite.id,
        type: 'gallery_invite',
        title: 'New Gallery Invite',
        description: `${invite.gallery.photographer.name} invited ${invite.email} to view gallery "${invite.gallery.name}"`,
        timestamp: invite.createdAt,
        status: invite.expiresAt && invite.expiresAt < new Date() ? 'expired' : 'active',
        metadata: {
          inviteId: invite.id,
          galleryId: invite.galleryId,
          photographerId: invite.gallery.photographer.id,
          email: invite.email
        }
      })
    })

    // Recent purchases
    const recentPurchases = await prisma.purchaseRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        photo: {
          include: {
            photographer: true
          }
        },
        user: true
      }
    })

    recentPurchases.forEach(purchase => {
      activities.push({
        id: purchase.id,
        type: 'photo_purchase',
        title: 'New Photo Purchase',
        description: `${purchase.user.name || purchase.user.email} purchased "${purchase.photo.title}" from ${purchase.photo.photographer.name}`,
        timestamp: purchase.createdAt,
        status: purchase.status,
        metadata: {
          purchaseId: purchase.id,
          photoId: purchase.photoId,
          userId: purchase.userId,
          photographerId: purchase.photo.photographerId,
          price: purchase.price,
          currency: purchase.currency
        }
      })
    })

    // Recent reviews
    const recentPhotoReviews = await prisma.photoReview.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        photo: {
          include: {
            photographer: true
          }
        },
        user: true
      }
    })

    recentPhotoReviews.forEach(review => {
      activities.push({
        id: review.id,
        type: 'photo_review',
        title: 'New Photo Review',
        description: `${review.user.name || review.user.email} reviewed "${review.photo.title}" by ${review.photo.photographer.name}`,
        timestamp: review.createdAt,
        status: review.rating >= 4 ? 'positive' : review.rating >= 2 ? 'neutral' : 'negative',
        metadata: {
          reviewId: review.id,
          photoId: review.photoId,
          userId: review.userId,
          photographerId: review.photo.photographerId,
          rating: review.rating
        }
      })
    })

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit)

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length
    })
  } catch (error) {
    console.error('Error in activities route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
