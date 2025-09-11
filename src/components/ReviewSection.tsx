'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, MessageCircle, Edit, Trash2, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface ReviewData {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

interface ReviewSectionProps {
  photoId: string
  className?: string
}

export default function ReviewSection({ photoId, className = '' }: ReviewSectionProps) {
  const { data: session } = useSession()
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [formData, setFormData] = useState({ rating: 5, comment: '' })
  const [error, setError] = useState('')

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/photo/${photoId}`)
      if (response.ok) {
        const data = await response.json()
        setReviewData(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [photoId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const submitReview = async () => {
    if (!session) {
      setError('Please sign in to leave a review')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await fetch(`/api/reviews/photo/${photoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({ rating: 5, comment: '' })
        setShowReviewForm(false)
        setEditingReview(null)
        await fetchReviews()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchReviews()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const startEdit = (review: Review) => {
    setEditingReview(review)
    setFormData({ rating: review.rating, comment: review.comment || '' })
    setShowReviewForm(true)
  }

  const cancelEdit = () => {
    setEditingReview(null)
    setFormData({ rating: 5, comment: '' })
    setShowReviewForm(false)
    setError('')
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  const userReview = reviewData?.reviews.find(review => review.user.email === session?.user?.email)
  const otherReviews = reviewData?.reviews.filter(review => review.user.email !== session?.user?.email) || []

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Review Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-xl font-semibold text-white">Reviews</h3>
          {reviewData && reviewData.totalReviews > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(Math.round(reviewData.averageRating))}
              <span className="text-sm text-gray-300">
                {reviewData.averageRating.toFixed(1)} ({reviewData.totalReviews} review{reviewData.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>

        {/* Add Review Button */}
        {session && !userReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border border-white/20 rounded-lg p-4 mb-6 bg-white/10">
          <h4 className="font-medium mb-3 text-white">
            {editingReview ? 'Edit Your Review' : 'Write a Review'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Rating</label>
              {renderStars(formData.rating, true, (rating) => 
                setFormData(prev => ({ ...prev, rating }))
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Comment (optional)</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your thoughts about this photo..."
                className="w-full p-3 border border-white/20 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/10 text-white placeholder-gray-400"
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={submitReview}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User's Review */}
      {userReview && (
        <div className="border border-blue-400/30 rounded-lg p-4 mb-4 bg-blue-500/10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">Your Review</span>
                {renderStars(userReview.rating)}
              </div>
              <span className="text-sm text-gray-300">
                {new Date(userReview.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(userReview)}
                className="p-1 text-gray-300 hover:text-blue-400 transition-colors"
                title="Edit review"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteReview(userReview.id)}
                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {userReview.comment && (
            <p className="text-gray-200">{userReview.comment}</p>
          )}
        </div>
      )}

      {/* Other Reviews */}
      {otherReviews.length > 0 && (
        <div className="space-y-4">
          {otherReviews.map((review) => (
            <div key={review.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{review.user.name || 'Anonymous'}</span>
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-300">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-200">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Reviews */}
      {reviewData && reviewData.totalReviews === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p>No reviews yet. Be the first to review this photo!</p>
        </div>
      )}
    </div>
  )
}