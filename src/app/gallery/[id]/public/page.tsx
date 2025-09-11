'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Download, Eye, Search, Grid, List, X, Share, Image as ImageIcon, Lock, Calendar, DollarSign, ShoppingCart, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
}

export default function PublicGalleryPage() {
  const params = useParams()
  
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price' | 'popularity'>('newest')
  const [filterBy, setFilterBy] = useState<'all' | 'for-sale' | 'free'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Fetch gallery details
  const fetchGallery = async (galleryPassword?: string) => {
    try {
      const url = `/api/gallery/${params.id}/public`
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (galleryPassword) {
        options.headers = {
          ...options.headers,
          'X-Gallery-Password': galleryPassword,
        }
      }

      const response = await fetch(url, options)
      
      if (response.status === 401) {
        setShowPasswordModal(true)
        setLoading(false)
        return
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Gallery not found or no longer available')
          return
        }
        throw new Error('Failed to fetch gallery')
      }
      
      const data = await response.json()
      setGallery(data)
      setShowPasswordModal(false)
    } catch (error) {
      console.error('Error fetching gallery:', error)
      setError('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchGallery()
    }
  }, [params.id])

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchGallery(password)
  }

  // Handle photo favorite
  const handleFavorite = async (photoId: string) => {
    try {
      const response = await fetch(`/api/gallery/${params.id}/photos/${photoId}/favorite`, {
        method: 'POST',
      })

      if (response.ok) {
        const newFavorites = new Set(favorites)
        if (favorites.has(photoId)) {
          newFavorites.delete(photoId)
        } else {
          newFavorites.add(photoId)
        }
        setFavorites(newFavorites)
        
        // Update photo in gallery
        setGallery(prev => prev ? {
          ...prev,
          photos: prev.photos.map(photo => 
            photo.id === photoId 
              ? { ...photo, favorites: photo.favorites + (favorites.has(photoId) ? -1 : 1) }
              : photo
          )
        } : null)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleBuyPhoto = (photo: Photo) => {
    if (!photo || !gallery) return
    
    const subject = `Purchase Request: ${photo.title}`
    const body = `Hello ${gallery.photographer.name},

I would like to purchase the following photo:

Photo: ${photo.title}
Price: $${photo.price}

Description: ${photo.description || 'No description provided'}

Please let me know the next steps for completing this purchase.

Best regards`
    
    const recipient = gallery.photographer?.email
    if (!recipient) {
      alert('Photographer contact email is not available')
      return
    }
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  const handleDownload = async (photo: Photo) => {
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

  // Get unique categories
  const categories = ['all', ...new Set(gallery?.photos.map(photo => photo.category).filter(Boolean) || [])]

  // Filter and sort photos
  const filteredPhotos = gallery?.photos
    .filter(photo => {
      // Search filter
      const matchesSearch = photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
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
          return (b.price || 0) - (a.price || 0)
        case 'popularity':
          return b.favorites - a.favorites
        default:
          return 0
      }
    }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Gallery Unavailable</h2>
          <p className="text-gray-300 mb-4">{error}</p>
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
              <span className="font-medium">{gallery?.title || "Gallery"}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {gallery?.photographer && (
              <div className="text-sm text-gray-300">
                by {gallery.photographer.businessName || gallery.photographer.name}
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

      {gallery && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Gallery Header */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">{gallery.title}</h1>
              {gallery.description && (
                <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">{gallery.description}</p>
              )}
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{gallery.views} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>{gallery.favorites} favorites</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>{gallery.totalPhotos} photos</span>
                </div>
                {gallery.expiresAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Expires {new Date(gallery.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
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
                onChange={(e) => setSortBy(e.target.value as any)}
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
                onChange={(e) => setFilterBy(e.target.value as any)}
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
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
                {filteredPhotos.length} of {gallery.totalPhotos} photos
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
                      alt={photo.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Photo Info */}
                  <div className={`p-3 ${
                    viewMode === 'list' ? 'ml-4 flex-1' : ''
                  }`}>
                    <h3 className="text-white font-medium text-sm mb-1 truncate">{photo.title}</h3>
                    <div className={`text-xs text-gray-400 ${
                      viewMode === 'grid' ? 'space-y-1' : 'flex space-x-4'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{photo.favorites}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{photo.downloads}</span>
                      </div>
                      {photo.isForSale && photo.price && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <DollarSign className="h-3 w-3" />
                          <span>${photo.price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity' : 'ml-auto'} flex space-x-1`}>
                    <button
                      onClick={(e) => {
                          e.stopPropagation()
                          handleFavorite(photo.id)
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          photo.isFavorited
                            ? 'bg-red-500 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    
                    {gallery.allowDownloads && (
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
                    
                    {photo.isForSale && photo.price && (
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
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'No photos found' : 'No photos available'}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search terms' : 'This gallery is empty'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Password Required</h2>
                <p className="text-gray-400">This gallery is password protected</p>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  placeholder="Enter gallery password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                  autoComplete="current-password"
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={!password.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  Access Gallery
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="relative">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white text-xl font-bold mb-2">{selectedPhoto.title}</h3>
                  {selectedPhoto.description && (
                    <p className="text-gray-300 mb-4">{selectedPhoto.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{selectedPhoto.favorites}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{selectedPhoto.downloads}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFavorite(selectedPhoto.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          favorites.has(selectedPhoto.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                        <span>Favorite</span>
                      </button>
                      
                      {gallery?.allowDownloads && (
                        <button
                          onClick={() => handleDownload(selectedPhoto)}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      )}
                      
                      {selectedPhoto.isForSale && selectedPhoto.price && (
                        <button
                          onClick={() => handleBuyPhoto(selectedPhoto)}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Buy ${selectedPhoto.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}