'use client'

import { motion } from 'framer-motion'
import { Heart, ArrowLeft, Eye, DollarSign, ShoppingCart, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface FavoritePhoto {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl: string
  price?: number
  isForSale: boolean
  addedAt: string
  inviteCode: string
  gallery: {
    id: string
    title: string
    photographer: {
      id: string
      name: string
      businessName?: string
      user: {
        email: string
      }
    }
  }
}

export default function InviteFavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [groupedFavorites, setGroupedFavorites] = useState<{[galleryId: string]: FavoritePhoto[]}>({})

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = () => {
    try {
      // Get all favorites from localStorage
      const allFavorites: FavoritePhoto[] = []
      
      // Iterate through localStorage to find all invite favorites
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('invite_favorites_')) {
          const inviteCode = key.replace('invite_favorites_', '')
          const favoritesData = localStorage.getItem(key)
          if (favoritesData) {
            const parsedData = JSON.parse(favoritesData)
            if (parsedData.favorites && Array.isArray(parsedData.favorites)) {
              parsedData.favorites.forEach((photo: Omit<FavoritePhoto, 'inviteCode' | 'addedAt'>) => {
                allFavorites.push({
                  ...photo,
                  inviteCode,
                  addedAt: parsedData.addedAt || new Date().toISOString()
                })
              })
            }
          }
        }
      }
      
      // Sort by most recently added
      allFavorites.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      
      setFavorites(allFavorites)
      
      // Group by gallery
      const grouped = allFavorites.reduce((acc, photo) => {
        if (!acc[photo.gallery.id]) {
          acc[photo.gallery.id] = []
        }
        acc[photo.gallery.id].push(photo)
        return acc
      }, {} as {[galleryId: string]: FavoritePhoto[]})
      
      setGroupedFavorites(grouped)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = (photoId: string, inviteCode: string) => {
    try {
      const storageKey = `invite_favorites_${inviteCode}`
      const favoritesData = localStorage.getItem(storageKey)
      
      if (favoritesData) {
        const parsedData = JSON.parse(favoritesData)
        if (parsedData.favorites) {
          parsedData.favorites = parsedData.favorites.filter((photo: { id: string }) => photo.id !== photoId)
          localStorage.setItem(storageKey, JSON.stringify(parsedData))
        }
      }
      
      // Reload favorites
      loadFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const handleBuyPhoto = (photo: FavoritePhoto) => {
    const subject = `Purchase Request: ${photo.title}`
    const body = `Hello ${photo.gallery.photographer.name || photo.gallery.photographer.businessName},\n\nI would like to purchase the following photo from your gallery "${photo.gallery.title}":\n\nPhoto: ${photo.title}\nDescription: ${photo.description || 'No description provided'}\n${photo.price ? `Listed Price: $${photo.price}` : ''}\n\nPlease let me know the pricing options and licensing terms.\n\nThank you!`
    
    const mailtoLink = `mailto:${photo.gallery.photographer.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  const handleEnquiry = (photo: FavoritePhoto) => {
    const subject = `Enquiry: ${photo.title}`
    const body = `Hello ${photo.gallery.photographer.name || photo.gallery.photographer.businessName},\n\nI have a question about the following photo from your gallery "${photo.gallery.title}":\n\nPhoto: ${photo.title}\nDescription: ${photo.description || 'No description provided'}\n\nMy question:\n[Please write your question here]\n\nThank you!`
    
    const mailtoLink = `mailto:${photo.gallery.photographer.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your favorites...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-red-400" />
              <h1 className="text-xl font-bold text-white">My Favorites</h1>
            </div>
            
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No favorites yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start exploring galleries and save photos you love to see them here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Summary */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {favorites.length} Favorite{favorites.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-gray-400">
                From {Object.keys(groupedFavorites).length} galler{Object.keys(groupedFavorites).length !== 1 ? 'ies' : 'y'}
              </p>
            </div>

            {/* Grouped by Gallery */}
            {Object.entries(groupedFavorites).map(([galleryId, photos]) => (
              <motion.div
                key={galleryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {photos[0].gallery.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      by {photos[0].gallery.photographer.name || photos[0].gallery.photographer.businessName}
                    </p>
                  </div>
                  <Link
                    href={`/invite/${photos[0].inviteCode}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    View Gallery
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 group"
                    >
                      {/* Photo */}
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={photo.thumbnailUrl}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Link
                              href={`/invite/${photo.inviteCode}/photo/${photo.id}`}
                              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            
                            <button
                              onClick={() => removeFavorite(photo.id, photo.inviteCode)}
                              className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Photo Info */}
                      <div className="p-3">
                        <h4 className="font-semibold text-white text-sm mb-1 truncate">
                          {photo.title}
                        </h4>
                        
                        {photo.price && (
                          <div className="flex items-center space-x-1 text-green-400 text-xs mb-2">
                            <DollarSign className="h-3 w-3" />
                            <span>${photo.price}</span>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-1">
                          {photo.isForSale && (
                            <button
                              onClick={() => handleBuyPhoto(photo)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              <span>Buy</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEnquiry(photo)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Ask</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}