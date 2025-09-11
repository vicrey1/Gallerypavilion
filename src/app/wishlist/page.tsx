'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Heart, ArrowLeft, Eye, DollarSign, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface WishlistPhoto {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl: string
  price?: number
  isForSale: boolean
  addedAt: string
  gallery: {
    id: string
    title: string
    photographer: {
      id: string
      name: string
      email: string
    }
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wishlist, setWishlist] = useState<WishlistPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user?.email) {
      router.push('/auth/signin')
      return
    }
    
    fetchWishlist()
  }, [session, status, router])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wishlist')
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }
      
      const data = await response.json()
      setWishlist(data.wishlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (photoId: string) => {
    try {
      const response = await fetch(`/api/wishlist?photoId=${photoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setWishlist(prev => prev.filter(photo => photo.id !== photoId))
      } else {
        console.error('Failed to remove from wishlist')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const handleBuyPhoto = (photo: WishlistPhoto) => {
    const subject = `Purchase Request: ${photo.title}`
    const body = `Hello ${photo.gallery.photographer.name},\n\nI would like to purchase the following photo from my wishlist:\n\nPhoto: ${photo.title}\nGallery: ${photo.gallery.title}\n\nDescription: ${photo.description || 'No description provided'}\n\nPlease let me know the pricing options and next steps for completing this purchase.\n\nBest regards`
    
    const recipient = photo.gallery.photographer?.email
    if (!recipient) {
      alert('Photographer contact email is not available')
      return
    }
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Wishlist</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => fetchWishlist()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Heart className="h-6 w-6 text-red-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-white">My Wishlist</h1>
                <p className="text-gray-300 text-sm">{wishlist.length} saved photos</p>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <Heart className="h-8 w-8 text-red-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">My Wishlist</h1>
                  <p className="text-gray-300">{wishlist.length} saved photos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm sm:text-base">
              Start exploring galleries and save photos you love to see them here.
            </p>
            <Link 
              href="/dashboard"
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2 active:scale-95"
            >
              <Eye className="h-4 w-4" />
              <span>Browse Galleries</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {wishlist.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                {/* Photo */}
                <div className="relative aspect-square">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Mobile Action Buttons - Always visible on mobile */}
                  <div className="absolute top-2 right-2 flex space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeFromWishlist(photo.id)}
                      className="bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600/80 active:bg-red-700/80 transition-colors active:scale-95"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Link
                        href={`/gallery/${photo.gallery.id}/photo/${photo.id}`}
                        className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 active:bg-white/40 transition-colors active:scale-95"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* For Sale Badge */}
                  {photo.isForSale && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                        For Sale
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Photo Info */}
                <div className="p-3 sm:p-4">
                  <h3 className="text-white font-semibold mb-1 truncate text-sm sm:text-base">{photo.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-2">{photo.gallery.photographer.name}</p>
                  <p className="text-gray-500 text-xs mb-3">Added {new Date(photo.addedAt).toLocaleDateString()}</p>
                  
                  {/* Pricing */}
                  {photo.isForSale && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1 text-green-400">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs sm:text-sm font-medium">
                          {photo.price ? `$${photo.price}` : 'Contact for pricing'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link
                      href={`/gallery/${photo.gallery.id}/photo/${photo.id}`}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors text-center active:scale-95"
                    >
                      View Details
                    </Link>
                    
                    {photo.isForSale && (
                      <button
                        onClick={() => handleBuyPhoto(photo)}
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1 active:scale-95"
                        title="Quick Buy"
                      >
                        <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm font-medium">Buy</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}