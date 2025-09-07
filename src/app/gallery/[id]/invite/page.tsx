'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Download, Eye, Search, Grid, List, X, Share, Image as ImageIcon, Lock, Calendar, DollarSign, ShoppingCart, Tag, FileImage } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

interface Photo {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl: string
  createdAt: string
  fileSize: number
  mimeType: string
  favorites: number
  downloads: number
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  isFavorited?: boolean
  basePrice?: number
}

interface Collection {
  id: string
  title: string
  description?: string
  photos: Photo[]
}

interface Gallery {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  createdAt: string
  expiresAt?: string
  isPublic: boolean
  allowDownloads: boolean
  requirePassword: boolean
  totalPhotos: number
  views: number
  favorites: number
  photos: Photo[]
  photographer: {
    id: string
    name: string
    email: string
    businessName?: string
  }
  collections: Collection[]
  stats: {
    totalPhotos: number
    totalInvites: number
  }
}

interface Permissions {
  canView: boolean
  canFavorite: boolean
  canComment: boolean
  canDownload: boolean
  canRequestPurchase: boolean
}

interface InviteData {
  gallery: Gallery
  permissions: Permissions
  invite: {
    id: string
    code: string
    type: string
    usageCount: number
    maxUsage?: number
    expiresAt?: string
  }
}

export default function InviteGalleryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [galleryData, setGalleryData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price' | 'popularity'>('newest')
  const [filterBy, setFilterBy] = useState<'all' | 'for-sale' | 'free'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const galleryId = params.id as string
  const inviteCode = searchParams.get('code')

  const validateInviteCode = useCallback(async () => {
    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate invite')
      }

      if (data.success && data.gallery.id === galleryId) {
        setGalleryData(data)
        // Store in sessionStorage for future use
        sessionStorage.setItem('inviteGalleryData', JSON.stringify(data))
      } else {
        throw new Error('Invalid invite or gallery mismatch')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }, [galleryId, inviteCode])

  useEffect(() => {
    // Try to get gallery data from sessionStorage first
    const storedData = sessionStorage.getItem('inviteGalleryData')
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as InviteData
        if (data.gallery.id === galleryId && data.invite.code === inviteCode) {
          setGalleryData(data)
          setLoading(false)
          return
        }
      } catch (e) {
        console.error('Error parsing stored gallery data:', e)
      }
    }

    // If no valid stored data, redirect back to invite page
    if (!inviteCode) {
      router.push('/invite')
      return
    }

    // Validate invite code again
    validateInviteCode()
  }, [galleryId, inviteCode, router, validateInviteCode])

  

  // Handle favorite toggle
  const toggleFavorite = async (photoId: string) => {
    if (!galleryData?.permissions.canFavorite) return
    
    const wasFavorited = favorites.has(photoId)
    
    try {
      const response = await fetch(`/api/gallery/${params.id}/photos/${photoId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: searchParams.get('code'),
          email: searchParams.get('email')
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update favorites state
        const newFavorites = new Set(favorites)
        if (wasFavorited) {
          newFavorites.delete(photoId)
        } else {
          newFavorites.add(photoId)
        }
        setFavorites(newFavorites)
        
        // Update photo in gallery data with API response
        setGalleryData(prev => prev ? {
          ...prev,
          gallery: {
            ...prev.gallery,
            photos: prev.gallery.photos.map(photo => 
              photo.id === photoId 
                ? { 
                    ...photo, 
                    favorites: result.favoriteCount || (photo.favorites + (wasFavorited ? -1 : 1)), 
                    isFavorited: result.isFavorited 
                  }
                : photo
            )
          }
        } : null)
      } else {
        console.error('Failed to toggle favorite:', response.statusText)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }
  
  const handleBuyPhoto = (photo: Photo) => {
    if (!photo || !galleryData?.gallery) return
    
    const subject = `Purchase Request: ${photo.title}`
    const body = `Hello ${galleryData.gallery.photographer.name},

I would like to purchase the following photo:

Photo: ${photo.title}
Price: $${photo.price || photo.basePrice}

Description: ${photo.description || 'No description provided'}

Please let me know the next steps for completing this purchase.

Best regards`
    
    const mailtoLink = `mailto:${galleryData.gallery.photographer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  const handleDownload = async (photo: Photo) => {
    if (!galleryData?.permissions.canDownload) return
    
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.title || `photo-${photo.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const allPhotos = galleryData?.gallery.photos || galleryData?.gallery.collections.flatMap(collection => collection.photos) || []
  const categories = ['all', ...new Set(allPhotos.map(photo => photo.category).filter(Boolean))]
  
  const filteredPhotos = allPhotos
    .filter(photo => {
      // Search filter
      const matchesSearch = !searchTerm || 
        photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory
      
      // Availability filter
      const matchesAvailability = filterBy === 'all' || 
        (filterBy === 'for-sale' && photo.isForSale) ||
        (filterBy === 'free' && !photo.isForSale)
      
      return matchesSearch && matchesCategory && matchesAvailability
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'price':
          return (b.price || b.basePrice || 0) - (a.price || a.basePrice || 0)
        case 'popularity':
          return (b.favorites || 0) - (a.favorites || 0)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (error || !galleryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
            <p className="text-red-200">{error || 'Failed to load gallery'}</p>
          </div>
          <button
            onClick={() => router.push('/invite')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Another Code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <Eye className="h-5 w-5" />
              <span className="font-medium">{galleryData?.gallery.title || "Gallery"}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {galleryData?.gallery.photographer && (
              <div className="text-sm text-gray-300">
                by {galleryData.gallery.photographer.businessName || galleryData.gallery.photographer.name}
              </div>
            )}
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
              }}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </nav>

      {galleryData && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Gallery Header */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{galleryData.gallery.title}</h1>
              {galleryData.gallery.description && (
                <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">{galleryData.gallery.description}</p>
              )}
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{galleryData.gallery.views || 0} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>{galleryData.gallery.favorites || 0} favorites</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>{galleryData.gallery.totalPhotos || allPhotos.length} photos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'newest' | 'oldest' | 'price' | 'popularity')}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest" className="bg-gray-800">Newest</option>
                <option value="oldest" className="bg-gray-800">Oldest</option>
                <option value="price" className="bg-gray-800">Price (High to Low)</option>
                <option value="popularity" className="bg-gray-800">Most Popular</option>
              </select>

              {/* Filter By Availability */}
              <select
                value={filterBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterBy(e.target.value as 'all' | 'for-sale' | 'free')}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all" className="bg-gray-800">All Photos</option>
                <option value="for-sale" className="bg-gray-800">For Sale</option>
                <option value="free" className="bg-gray-800">Free</option>
              </select>

              {/* Category Filter */}
              {categories.length > 1 && (
                <select
                  value={selectedCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              )}
              
              <span className="text-gray-400">
                {filteredPhotos.length} of {allPhotos.length} photos
              </span>
            </div>
            
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Photos Grid */}
          {filteredPhotos.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-4'
            }>
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 overflow-hidden cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center p-4' : ''
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Photo */}
                  <div className={`relative ${
                    viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden'
                  }`}>
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.title || 'Photo'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Photo Info */}
                  <div className={`p-3 ${
                    viewMode === 'list' ? 'ml-4 flex-1' : ''
                  }`}>
                    <h3 className="text-white font-medium text-sm mb-1 truncate">{photo.title || 'Untitled'}</h3>
                    <div className={`text-xs text-gray-400 ${
                      viewMode === 'grid' ? 'space-y-1' : 'flex space-x-4'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{photo.favorites || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{photo.downloads || 0}</span>
                      </div>
                      {photo.isForSale && (photo.price || photo.basePrice) && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <DollarSign className="h-3 w-3" />
                          <span>${photo.price || photo.basePrice}</span>
                        </div>
                      )}
                    </div>
                    
                    {photo.tags.length > 0 && viewMode === 'grid' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {photo.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {photo.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{photo.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity' : 'ml-auto'} flex space-x-1`}>
                    {galleryData.permissions.canFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(photo.id)
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          favorites.has(photo.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    )}
                    
                    {galleryData.permissions.canDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(photo)
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    {photo.isForSale && (photo.price || photo.basePrice) && galleryData.permissions.canRequestPurchase && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBuyPhoto(photo)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No photos found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}