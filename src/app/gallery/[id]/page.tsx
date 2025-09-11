'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Upload, Eye, Heart, Download, Users, Grid, List, X, Edit, Trash2, Share, ArrowLeft, Image as ImageIcon, Filter, Search, Star, DollarSign, Tag, SlidersHorizontal, Layers, TrendingUp, Award, Palette } from 'lucide-react'

import MasonryGrid from '@/components/MasonryGrid'
import PhotoLightbox from '@/components/PhotoLightbox'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import PhotoEditModal from '@/components/PhotoEditModal'
import InviteModal from '@/components/InviteModal'

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
  isFavorited?: boolean
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  orientation?: 'landscape' | 'portrait' | 'square'
  photographer?: {
    id: string
    name: string
    email: string
  }
}

interface Gallery {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  createdAt: string
  expiresAt?: string
  isPublic: boolean

  requirePassword: boolean
  totalPhotos: number
  views: number
  favorites: number
  invites: number
  photos: Photo[]
  invitedUsers: Array<{
    id: string
    email: string
    status: string
    invitedAt: string
  }>
}

interface GalleryUpdateData {
  title?: string
  description?: string
  status?: 'draft' | 'active' | 'archived'
  expiresAt?: string | null
  isPublic?: boolean

  requirePassword?: boolean
  password?: string
}

export default function GalleryDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('masonry')
  
  // Marketplace state
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'popular'>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const [locationFilter, setLocationFilter] = useState('')
  const [tagsFilter, setTagsFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [forSaleFilter, setForSaleFilter] = useState('')
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Redirect if not authenticated or not a photographer
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      setError('Please log in as a photographer to access galleries')
      setLoading(false)
      return
    }
    if (session.user?.role !== 'photographer') {
      setError('Photographer access required')
      setLoading(false)
      return
    }
  }, [session, status, router])

  // Fetch gallery details
  const fetchGallery = async () => {
    try {
      console.log('Session data:', session)
      console.log('User role:', session?.user?.role)
      console.log('Photographer ID:', session?.user?.photographerId)
      
      const response = await fetch(`/api/photographer/galleries/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Gallery not found')
          return
        }
        if (response.status === 401) {
          setError('Unauthorized - Please sign in as a photographer or your session may have expired')
          return
        }
        throw new Error('Failed to fetch gallery')
      }
      const data = await response.json()
      setGallery(data)
    } catch (error) {
      console.error('Error fetching gallery:', error)
      setError('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'photographer' && session?.user?.photographerId && params.id) {
      fetchGallery()
    } else if (session?.user?.role === 'photographer' && !session?.user?.photographerId) {
      setError('Photographer ID not found in session. Please log out and log back in.')
      setLoading(false)
    }
  }, [session, params.id])

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !gallery) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('galleryId', gallery.id)
      const fileName = file.name
      const dotIndex = fileName.lastIndexOf('.')
      const nameWithoutExtension = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName
      formData.append('title', nameWithoutExtension)

      try {
        const response = await fetch('/api/photographer/photos', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to upload photo')
        return await response.json()
      } catch (error) {
        console.error('Error uploading photo:', error)
        throw error
      }
    })

    try {
      const uploadedPhotos = await Promise.all(uploadPromises)
      setGallery(prev => prev ? {
        ...prev,
        photos: [...uploadedPhotos, ...prev.photos],
        totalPhotos: prev.totalPhotos + uploadedPhotos.length
      } : null)
      setShowUploadModal(false)
    } catch (error) {
      setError('Failed to upload some photos')
    } finally {
      setUploading(false)
    }
  }

  // Handle photo deletion
  const handleDeletePhotos = async () => {
    if (!selectedPhotos.size) return

    try {
      const deletePromises = Array.from(selectedPhotos).map(photoId =>
        fetch(`/api/photographer/photos/${photoId}`, { 
          method: 'DELETE',
          credentials: 'include'
        })
      )

      await Promise.all(deletePromises)
      
      setGallery(prev => prev ? {
        ...prev,
        photos: prev.photos.filter(photo => !selectedPhotos.has(photo.id)),
        totalPhotos: prev.totalPhotos - selectedPhotos.size
      } : null)
      
      setSelectedPhotos(new Set())
    } catch (error) {
      setError('Failed to delete photos')
    }
  }

  // Handle gallery update
  const handleUpdateGallery = async (updateData: GalleryUpdateData) => {
    try {
      const response = await fetch(`/api/photographer/galleries/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Failed to update gallery')
      
      const updatedGallery = await response.json()
      setGallery(prev => prev ? { ...prev, ...updatedGallery } : null)
      setShowEditModal(false)
    } catch (error) {
      setError('Failed to update gallery')
    }
  }

  // Handle photo edit
  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo)
    setShowPhotoEditModal(true)
  }

  // Handle photo update
  const handleUpdatePhoto = async (photoData: Partial<Photo>) => {
    if (!editingPhoto) return

    try {
      const response = await fetch(`/api/photographer/photos/${editingPhoto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(photoData),
      })

      if (!response.ok) throw new Error('Failed to update photo')
      
      const updatedPhoto = await response.json()
      
      setGallery(prev => prev ? {
        ...prev,
        photos: prev.photos.map(photo => 
          photo.id === editingPhoto.id ? { ...photo, ...updatedPhoto } : photo
        )
      } : null)
      
      setShowPhotoEditModal(false)
      setEditingPhoto(null)
    } catch (error) {
      setError('Failed to update photo')
    }
  }

  // Handle favorite toggle
  const toggleFavorite = async (photoId: string) => {
    const wasFavorited = favorites.has(photoId)
    
    try {
      const response = await fetch(`/api/gallery/${params.id}/photos/${photoId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        setGallery(prev => prev ? {
          ...prev,
          photos: prev.photos.map(photo => 
            photo.id === photoId 
              ? { 
                  ...photo, 
                  favorites: result.favoriteCount || (photo.favorites + (wasFavorited ? -1 : 1)), 
                  isFavorited: result.isFavorited 
                }
              : photo
          )
        } : null)
      } else {
        console.error('Failed to toggle favorite:', response.statusText)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const filteredAndSortedPhotos = () => {
    if (!gallery) return []
    
    console.log('Total photos before filtering:', gallery.photos.length)
    console.log('Current filter states:')
    console.log('- searchQuery:', searchQuery)
    console.log('- selectedCategory:', selectedCategory)
    console.log('- priceRange:', priceRange)
    console.log('- selectedTags:', selectedTags)
    console.log('- locationFilter:', locationFilter)
    console.log('- forSaleFilter:', forSaleFilter)
    console.log('- tagsFilter:', tagsFilter)
    console.log('- dateFilter:', dateFilter)
    
    let filtered = gallery.photos.filter(photo => {
      console.log(`Filtering photo: ${photo.id} - ${photo.title}`)
      
      // Search filter
      if (searchQuery && !photo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !photo.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        console.log(`Photo ${photo.id} filtered out by search query`)
        return false
      }
      
      // Category filter
      if (selectedCategory !== 'all' && selectedCategory && photo.category !== selectedCategory) {
        console.log(`Photo ${photo.id} filtered out by category filter`)
        return false
      }
      
      // Price filter
      const price = photo.price || 0
      if (price < priceRange[0] || price > priceRange[1]) {
        console.log(`Photo ${photo.id} filtered out by price filter`)
        return false
      }
      
      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some(tag => photo.tags.includes(tag))) {
        console.log(`Photo ${photo.id} filtered out by selectedTags filter`)
        return false
      }
      
       // Location filter
       if (locationFilter && !photo.location?.toLowerCase().includes(locationFilter.toLowerCase())) {
         console.log(`Photo ${photo.id} filtered out by location filter`)
         return false
       }
       
       // For sale filter
       if (forSaleFilter === 'for-sale' && !photo.isForSale) {
         console.log(`Photo ${photo.id} filtered out by for-sale filter`)
         return false
       }
       if (forSaleFilter === 'not-for-sale' && photo.isForSale) {
         console.log(`Photo ${photo.id} filtered out by not-for-sale filter`)
         return false
       }
      
      // Tags filter (from input)
      if (tagsFilter) {
        const filterTags = tagsFilter.split(',').map(tag => tag.trim().toLowerCase())
        if (!filterTags.some(tag => photo.tags.some(photoTag => photoTag.toLowerCase().includes(tag)))) {
          console.log(`Photo ${photo.id} filtered out by tagsFilter`)
          return false
        }
      }
      
      // Date filter
      if (dateFilter) {
        const photoDate = new Date(photo.createdAt)
        const now = new Date()
        
        switch (dateFilter) {
          case 'today':
            if (photoDate.toDateString() !== now.toDateString()) return false
            break
          case 'week':
            const weekMilliseconds = 7 * 24 * 60 * 60 * 1000
            const weekAgo = new Date(now.getTime() - weekMilliseconds)
            if (photoDate < weekAgo) return false
            break
          case 'month':
            const monthMilliseconds = 30 * 24 * 60 * 60 * 1000
            const monthAgo = new Date(now.getTime() - monthMilliseconds)
            if (photoDate < monthAgo) return false
            break
          case 'year':
            const yearMilliseconds = 365 * 24 * 60 * 60 * 1000
            const yearAgo = new Date(now.getTime() - yearMilliseconds)
            if (photoDate < yearAgo) return false
            break
        }
      }
      
      return true
    })
    
    console.log('Photos after filtering:', filtered.length)
    console.log('Filtered photos:', filtered.map(p => ({ id: p.id, title: p.title })))
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        case 'popular':
          return (b.favorites + b.downloads) - (a.favorites + a.downloads)
        default:
          return 0
      }
    })
    
    return filtered
  }

  const getAllCategories = () => {
    if (!gallery) return []
    const categories = new Set(gallery.photos.map(photo => photo.category).filter(Boolean))
    return Array.from(categories)
  }

  const getAllTags = () => {
    if (!gallery) return []
    const tags = new Set(gallery.photos.flatMap(photo => photo.tags))
    return Array.from(tags)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setPriceRange([0, 1000])
    setSelectedCategory('all')
    setSelectedTags([])
    setLocationFilter('')
    setTagsFilter('')
    setDateFilter('')
    setForSaleFilter('')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-b-white mx-auto mb-4"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'photographer') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            {error.includes('log in') && (
              <Link
                href="/auth/photographer-login"
                className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Login as Photographer
              </Link>
            )}
            <Link
              href="/"
              className="block bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <Link href="/dashboard" className="flex items-center space-x-2 text-white hover:text-purple-300">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Link>
              
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                gallery.status === 'active' ? 'bg-green-500 text-white' :
                gallery.status === 'draft' ? 'bg-yellow-500 text-black' :
                'bg-red-500 text-white'
              }`}>
                {gallery.status}
              </div>
            </div>
            
            <div className="mb-3">
              <h1 className="text-white font-medium text-lg truncate">{gallery.title}</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm flex-1"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm flex-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Photos</span>
              </button>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-white hover:text-purple-300">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="text-gray-300">•</div>
              <span className="text-white font-medium">{gallery.title}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gallery.status === 'active' ? 'bg-green-500 text-white' :
                gallery.status === 'draft' ? 'bg-yellow-500 text-black' :
                'bg-red-500 text-white'
              }`}>
                {gallery.status}
              </div>
              
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Gallery</span>
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Photos</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Marketplace Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Header */}
          <div className="block sm:hidden mb-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white">{gallery.title}</h1>
              <p className="text-gray-400 mt-1 text-sm">{gallery.description}</p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                <span>{filteredAndSortedPhotos().length} photos</span>
                <span>•</span>
                <span>{gallery.views} views</span>
                <span>•</span>
                <span>{gallery.favorites} favorites</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors w-full"
              >
                <Share className="h-4 w-4" />
                <span>Invite Clients</span>
              </button>
              
              <Link
                href={`/gallery/${gallery.id}/public`}
                className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors w-full"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Gallery</span>
              </Link>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:block mb-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">{gallery.title}</h1>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      gallery.status === 'active' ? 'bg-green-500 text-white' :
                      gallery.status === 'draft' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {gallery.status}
                    </div>
                  </div>
                  {gallery.description && (
                    <p className="text-gray-300 text-lg mb-4 max-w-2xl">{gallery.description}</p>
                  )}
                  
                  {/* Professional Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Camera className="h-5 w-5 text-purple-400" />
                        <span className="text-sm text-gray-400">Photos</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{filteredAndSortedPhotos().length}</div>
                      <div className="text-xs text-gray-500">Total images</div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="h-5 w-5 text-blue-400" />
                        <span className="text-sm text-gray-400">Views</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{gallery.views.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Gallery visits</div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="h-5 w-5 text-red-400" />
                        <span className="text-sm text-gray-400">Favorites</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{gallery.favorites}</div>
                      <div className="text-xs text-gray-500">Client likes</div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-gray-400">Invites</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{gallery.invites}</div>
                      <div className="text-xs text-gray-500">Active clients</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 ml-8">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                  >
                    <Share className="h-5 w-5" />
                    <span>Invite Clients</span>
                  </button>
                  
                  <Link
                    href={`/gallery/${gallery.id}/public`}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <Eye className="h-5 w-5" />
                    <span>Preview Gallery</span>
                  </Link>
                  
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors border border-white/20"
                  >
                    <Edit className="h-5 w-5" />
                    <span>Edit Gallery</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="mb-6">
            {/* Mobile Search and Filter */}
            <div className="block sm:hidden space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    showFilters ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>
            
            {/* Desktop Search and Filter */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search photos by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  showFilters ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 sm:p-6 mb-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Price Range</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange[0] || ''}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange[1] || ''}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Categories</option>
                      {getAllCategories().map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Location</label>
                    <input
                      type="text"
                      placeholder="Enter location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  {/* Date Range */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Date Added</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Any Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  
                  {/* For Sale Filter */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Availability</label>
                    <select
                      value={forSaleFilter}
                      onChange={(e) => setForSaleFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Photos</option>
                      <option value="for-sale">For Sale Only</option>
                      <option value="not-for-sale">Not for Sale</option>
                    </select>
                  </div>
                  
                  {/* Tags Filter */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm sm:text-base">Tags</label>
                    <input
                      type="text"
                      placeholder="Enter tags (comma separated)..."
                      value={tagsFilter}
                      onChange={(e) => setTagsFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-white/10 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-400">
                    {filteredAndSortedPhotos().length} of {gallery.photos.length} photos
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      Clear All
                    </button>
                    
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Photo Management Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            {selectedPhotos.size > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <span className="text-white text-sm">{selectedPhotos.size} selected</span>
                 <div className="flex space-x-2">
                   <button
                     onClick={() => window.open(`mailto:support@gallerypavilion.com?subject=Certificate Request for Selected Photos&body=Hello, I would like to request certificates of authenticity for the selected photos.`, '_blank')}
                     className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                   >
                     <Award className="h-4 w-4" />
                     <span>Certificates</span>
                   </button>
                  <button
                    onClick={handleDeletePhotos}
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedPhotos(new Set())}
                    className="text-gray-400 hover:text-white text-sm px-3 py-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex bg-white/10 rounded-lg p-1 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'masonry' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Masonry View"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Marketplace Photos Grid */}
        {filteredAndSortedPhotos().length > 0 ? (
          viewMode === 'masonry' ? (
            <MasonryGrid
              photos={filteredAndSortedPhotos()}
              onPhotoClick={(photo) => router.push(`/gallery/${gallery.id}/photo/${photo.id}`)}
              onEditPhoto={handleEditPhoto}
              onDeletePhoto={(photoId) => {
                const newSelected = new Set([photoId])
                setSelectedPhotos(newSelected)
                handleDeletePhotos()
              }}
              onFavorite={toggleFavorite}
              selectedPhotos={selectedPhotos}
              onPhotoSelect={(photoId, selected) => {
                const newSelected = new Set(selectedPhotos)
                if (selected) {
                  newSelected.add(photoId)
                } else {
                  newSelected.delete(photoId)
                }
                setSelectedPhotos(newSelected)
              }}
              showActions={true}
            />
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'
              : 'space-y-3 sm:space-y-4'
            }>
              {filteredAndSortedPhotos().map((photo) => (
                <Link key={photo.id} href={`/gallery/${gallery.id}/photo/${photo.id}`}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 overflow-hidden hover:shadow-2xl cursor-pointer active:scale-95 ${
                    viewMode === 'list' ? 'flex items-center p-3 sm:p-4' : ''
                  }`}
                >
                {/* Photo */}
                <div className={`relative ${
                  viewMode === 'grid' ? 'aspect-square' : 'w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden'
                }`}>
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  
                  {/* Photo overlay with quick actions */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="absolute top-2 left-2">
                       <input
                         type="checkbox"
                         checked={selectedPhotos.has(photo.id)}
                         onChange={(e) => {
                           e.stopPropagation()
                           const newSelected = new Set(selectedPhotos)
                           if (e.target.checked) {
                             newSelected.add(photo.id)
                           } else {
                             newSelected.delete(photo.id)
                           }
                           setSelectedPhotos(newSelected)
                         }}
                         className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
                       />
                     </div>
                     <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                       <div className="flex space-x-1">
                         <button 
                           onClick={(e) => {
                             e.preventDefault()
                             e.stopPropagation()
                             window.location.href = `/gallery/${gallery.id}/photo/${photo.id}`
                           }}
                           className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors"
                         >
                           <Eye className="h-3 w-3" />
                         </button>
                         <button 
                           onClick={(e) => {
                             e.preventDefault()
                             e.stopPropagation()
                             handleEditPhoto(photo)
                           }}
                           className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors"
                         >
                           <Edit className="h-3 w-3" />
                         </button>
                       </div>
                       
                       {photo.isForSale && (
                         <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                           For Sale
                         </div>
                       )}
                     </div>
                   </div>
                  
                  {/* Bestseller badge */}
                  {photo.downloads > 10 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      Popular
                    </div>
                  )}
                </div>

                {/* Photo Info */}
                <div className={`p-3 sm:p-4 ${
                  viewMode === 'list' ? 'ml-3 sm:ml-4 flex-1' : ''
                }`}>
                  <h3 className="text-white font-semibold text-sm sm:text-base mb-2 line-clamp-2">{photo.title}</h3>
                  
                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {photo.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-gray-400 text-xs">+{photo.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className={`text-xs text-gray-400 mb-3 ${
                    viewMode === 'grid' ? 'flex justify-between' : 'flex flex-wrap gap-2 sm:space-x-4 sm:gap-0'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{photo.favorites}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-3 w-3" />
                      <span>{photo.downloads}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span suppressHydrationWarning>{(() => {
                        const randomValue = Math.random()
                        const multipliedValue = randomValue * 2
                        const finalRating = multipliedValue + 3
                        return finalRating.toFixed(1)
                      })()}</span>
                    </div>
                  </div>
                  
                  {/* Pricing */}
                  {photo.isForSale && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Price</span>
                        <span className="text-white font-bold">${photo.price || 0}</span>
                      </div>
                    </div>
                  )}
                  
                  {!photo.isForSale && (
                    <div className="text-center py-2">
                      <span className="text-gray-500 text-xs">Not for sale</span>
                    </div>
                  )}
                 </div>
               </motion.div>
             </Link>
             ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No photos yet</h3>
            <p className="text-gray-400 mb-4">Upload your first photos to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Upload Photos
            </button>
          </div>
        )}
      </div>



      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upload Photos</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-2">Click to upload photos</p>
                <p className="text-sm text-gray-400">or drag and drop files here</p>
                <p className="text-xs text-gray-500 mt-2">JPEG, PNG, WebP up to 10MB each</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />

              {uploading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b border-purple-500 mx-auto mb-2" style={{borderBottomWidth: '2px'}}></div>
                  <p className="text-sm text-gray-400">Uploading photos...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Edit Modal */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          isOpen={showPhotoEditModal}
          onClose={() => {
            setShowPhotoEditModal(false)
            setEditingPhoto(null)
          }}
          onSave={handleUpdatePhoto}
        />
      )}
      
      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        galleryId={gallery?.id || ''}
        galleryTitle={gallery?.title || ''}
      />
      

    </div>
  )
}