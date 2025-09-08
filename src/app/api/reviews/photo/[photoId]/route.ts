export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/jwt'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

// GET /api/reviews/photo/[photoId] - Get reviews for a photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params

    // Get reviews for the photo
    let reviews
    try {
      reviews = await withPrismaRetry(() => prisma.photoReview.findMany({ where: { photoId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } }))
    } catch (dbErr) {
      console.error('DB error fetching photo reviews in GET /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    })
  } catch (error) {
    console.error('Error fetching photo reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/photo/[photoId] - Add or update a review for a photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params
    const payload = getUserFromRequest(request)

    if (!payload?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = reviewSchema.parse(body)

    // Get user
    let user
    try {
      user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email: payload.email } }))
    } catch (dbErr) {
      console.error('DB error fetching user in POST /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if photo exists
    let photo
    try {
      photo = await withPrismaRetry(() => prisma.photo.findUnique({ where: { id: photoId } }))
    } catch (dbErr) {
      console.error('DB error fetching photo in POST /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this photo
    let existingReview
    try {
      existingReview = await withPrismaRetry(() => prisma.photoReview.findUnique({ where: { userId_photoId: { userId: user.id, photoId } } }))
    } catch (dbErr) {
      console.error('DB error checking existing review in POST /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    let review
    if (existingReview) {
      // Update existing review
      try {
        review = await withPrismaRetry(() => prisma.photoReview.update({ where: { id: existingReview.id }, data: { rating: validatedData.rating, comment: validatedData.comment }, include: { user: { select: { id: true, name: true, email: true } } } }))
      } catch (dbErr) {
        console.error('DB error updating review in POST /api/reviews/photo/[photoId]:', dbErr)
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      }
    } else {
      // Create new review
      try {
        review = await withPrismaRetry(() => prisma.photoReview.create({ data: { rating: validatedData.rating, comment: validatedData.comment, userId: user.id, photoId }, include: { user: { select: { id: true, name: true, email: true } } } }))
      } catch (dbErr) {
        console.error('DB error creating review in POST /api/reviews/photo/[photoId]:', dbErr)
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      }
    }

    return NextResponse.json(review, { status: existingReview ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating/updating photo review:', error)
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/photo/[photoId] - Delete a review for a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params
    const payload = getUserFromRequest(request)

    if (!payload?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user
    let user
    try {
      user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email: payload.email } }))
    } catch (dbErr) {
      console.error('DB error fetching user in DELETE /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find and delete the review
    let review
    try {
      review = await withPrismaRetry(() => prisma.photoReview.findUnique({ where: { userId_photoId: { userId: user.id, photoId } } }))
    } catch (dbErr) {
      console.error('DB error fetching review in DELETE /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    try {
      await withPrismaRetry(() => prisma.photoReview.delete({ where: { id: review.id } }))
    } catch (dbErr) {
      console.error('DB error deleting review in DELETE /api/reviews/photo/[photoId]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting photo review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}