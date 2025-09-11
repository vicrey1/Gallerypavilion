'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Search, Grid, List, X, Share, Image as ImageIcon, Lock, Calendar, DollarSign, ShoppingCart, Tag, FileImage } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  basePrice?: number
  
  // Artwork Information
  photographerName?: string
  yearCreated?: string
  yearPrinted?: string
  seriesName?: string
  
  // Edition & Authenticity
  editionNumber?: string
  editionSize?: number
  signatureType?: string
  certificateOfAuthenticity?: boolean
  
  // Materials & Size
  medium?: string
  printingTechnique?: string
  paperType?: string
  dimensions?: {
    image?: string
    paper?: string
    framed?: string
  }
  framingOptions?: string[]
  
  // Context
  artistStatement?: string
  exhibitionHistory?: string[]
  
  // Purchase Information
  shippingDetails?: {
    method: string
    timeframe: string
  }
  returnPolicy?: string
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
  requirePassword: boolean
  totalPhotos: number
  views: number
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
  canComment: boolean
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
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseEmail, setPurchaseEmail] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const closePhotoViewer = () => setSelectedPhoto(null)

  const handleRequestPurchase = async (photo: Photo) => {
    setSubmitting(true)
    setPurchaseError(null)

    try {
      const response = await fetch(`/api/gallery/${params.id}/photos/${photo.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: searchParams.get('code'),
          email: purchaseEmail,
          message: purchaseMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit purchase request')
      }

      // Close modals and show success message
      setPurchaseModalOpen(false)
      setSelectedPhoto(null)
      
      // Reset form
      setPurchaseEmail('')
      setPurchaseMessage('')
      
      // Show success notification (you can implement this)
      alert('Purchase request submitted successfully')
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Failed to submit purchase request')
    } finally {
      setSubmitting(false)
    }
  }

  const galleryId = params.id as string
  const inviteCode = searchParams.get('code')

  useEffect(() => {
    console.log('Gallery invite page loaded:', { galleryId, inviteCode })

    // Try to get gallery data from sessionStorage first
    const storedData = sessionStorage.getItem('inviteGalleryData')
    console.log('Stored gallery data:', storedData)
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as InviteData
        console.log('Parsed gallery data:', data)
        
        if (data.gallery.id === galleryId && data.invite.code === inviteCode) {
          console.log('Gallery data matches current route, setting gallery data')
          setGalleryData(data)
          setLoading(false)
          return
        } else {
          console.log('Gallery data mismatch:', {
            storedGalleryId: data.gallery.id,
            routeGalleryId: galleryId,
            storedInviteCode: data.invite.code,
            routeInviteCode: inviteCode
          })
        }
      } catch (e) {
        console.error('Error parsing stored gallery data:', e)
      }
    }

    // If no valid stored data, redirect back to invite page
    if (!inviteCode) {
      console.log('No invite code found, redirecting to invite page')
      router.push('/invite')
      return
    }

    // Validate invite code again
    validateInviteCode()
  }, [galleryId, inviteCode, router])

  const validateInviteCode = async () => {
    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode })
      })

      const data = await response.json()
      console.log('Validation response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate invite')
      }

      if (data.success && data.gallery.id === galleryId) {
        console.log('Validation successful, updating gallery data')
        setGalleryData(data)
        // Store in sessionStorage for future use
        sessionStorage.setItem('inviteGalleryData', JSON.stringify(data))
      } else {
        console.log('Gallery mismatch:', {
          responseGalleryId: data.gallery?.id,
          routeGalleryId: galleryId
        })
        throw new Error('Invalid invite or gallery mismatch')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  // Handle purchase request - open user's email client with prefilled purchase message
  const handleBuyPhoto = (photo: Photo) => {
    if (!galleryData) return

    const subject = `Purchase request for photo: ${photo.title || 'Untitled'}`
    const body = `Hi ${galleryData.gallery.photographer.name},\n\nI would like to purchase the photo "${photo.title || 'Untitled'}" from your gallery "${galleryData.gallery.title}".\n\nDetails:\n- Price: ${photo.price ? '$' + (photo.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'On Request'}\n- Artwork: ${photo.title || 'Untitled'}\n\nPlease let me know the next steps for completing this purchase.\n\nBest regards`;

    const recipient = galleryData?.gallery.photographer?.email
    if (!recipient) {
      alert('Photographer contact email is not available')
      return
    }

    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
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
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest" className="bg-gray-800">Newest</option>
                <option value="oldest" className="bg-gray-800">Oldest</option>
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
                      {photo.isForSale && (photo.price || photo.basePrice) && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <DollarSign className="h-3 w-3" />
                          <span>${(photo.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      
      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
            onClick={closePhotoViewer}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl mx-auto my-4 md:my-8 bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closePhotoViewer}
                className="fixed top-4 right-4 z-50 bg-black/50 text-white/70 hover:text-white p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Main Content */}
              <div className="flex flex-col lg:flex-row h-full">
                {/* Photo Section */}
                <div className="lg:flex-1 relative bg-black">
                  <div className="relative h-[50vh] lg:h-full">
                    <Image
                      src={selectedPhoto.url}
                      alt={selectedPhoto.title || 'Photo'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 1024px"
                      priority
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div className="lg:w-[480px] xl:w-[560px] bg-gray-900 p-6 lg:p-8 overflow-y-auto">
                  {/* Title and Quick Actions */}
                  <div className="mb-8">
                    <h2 className="text-white text-3xl font-medium mb-3">
                      {selectedPhoto.title || 'Untitled'}
                    </h2>
                    {selectedPhoto.photographerName && (
                      <p className="text-xl text-gray-300 mb-2">
                        by {selectedPhoto.photographerName}
                      </p>
                    )}
                    {selectedPhoto.description && (
                      <p className="text-gray-300 text-lg leading-relaxed mt-4">
                        {selectedPhoto.description}
                      </p>
                    )}
                  </div>

                  {/* Purchase Information */}
                  {selectedPhoto.isForSale && (
                    <div className="mb-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-medium">Purchase Information</h3>
                        {selectedPhoto.price ? (
                          <div className="text-green-400 font-medium text-2xl">
                            ${selectedPhoto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <div className="text-green-400 font-medium">Price on Request</div>
                        )}
                      </div>
                      
                      {selectedPhoto.shippingDetails && (
                        <div className="text-gray-300 mb-4 space-y-2">
                          <p><span className="text-gray-400">Shipping Method:</span> {selectedPhoto.shippingDetails.method}</p>
                          <p><span className="text-gray-400">Delivery Time:</span> {selectedPhoto.shippingDetails.timeframe}</p>
                        </div>
                      )}
                      
                      {selectedPhoto.returnPolicy && (
                        <p className="text-gray-300 mb-4">
                          <span className="text-gray-400">Return Policy:</span> {selectedPhoto.returnPolicy}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const subject = `Inquiry: ${selectedPhoto.title || 'Untitled'} ${selectedPhoto.editionNumber || ''}`;
                            const body = `I am interested in purchasing:\n\n` +
                              `Artwork: ${selectedPhoto.title || 'Untitled'}\n` +
                              `Edition: ${selectedPhoto.editionNumber || 'N/A'}\n` +
                              `Price: ${selectedPhoto.price ? '$' + selectedPhoto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'On Request'}\n\n` +
                              `Please provide more information about purchasing this artwork.`;
                            const recipient = galleryData?.gallery.photographer?.email
                            if (!recipient) {
                              alert('Photographer contact email is not available')
                              return
                            }
                            window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-base flex items-center justify-center"
                        >
                          Send Inquiry
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            const subject = `Purchase request for photo: ${selectedPhoto?.title || 'Untitled'}`
                            const body = `Hi ${galleryData?.gallery.photographer.name},\n\nI would like to purchase the photo "${selectedPhoto?.title || 'Untitled'}" from your gallery "${galleryData?.gallery.title}".\n\nDetails:\n- Price: ${selectedPhoto?.price ? '$' + (selectedPhoto.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'On Request'}\n- Artwork: ${selectedPhoto?.title || 'Untitled'}\n\nPlease let me know the next steps for completing this purchase.\n\nBest regards`;
                            const recipient = galleryData?.gallery.photographer?.email
                            if (!recipient) {
                              alert('Photographer contact email is not available')
                              return
                            }
                            window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-base flex items-center justify-center"
                        >
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Purchase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Artwork Information */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h3 className="text-white text-xl font-medium border-b border-gray-700 pb-2">Artwork Information</h3>
                      <div className="grid gap-3">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                          <span>Created: {selectedPhoto.yearCreated || new Date(selectedPhoto.createdAt).getFullYear()}</span>
                        </div>
                        {selectedPhoto.yearPrinted && (
                          <div className="flex items-center text-gray-300">
                            <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                            <span>Printed: {selectedPhoto.yearPrinted}</span>
                          </div>
                        )}
                        {selectedPhoto.seriesName && (
                          <div className="flex items-center text-gray-300">
                            <Tag className="h-4 w-4 mr-3 text-gray-400" />
                            <span>Series: {selectedPhoto.seriesName}</span>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Edition & Authenticity */}
                    <section className="space-y-4">
                      <h3 className="text-white text-xl font-medium border-b border-gray-700 pb-2">Edition & Authenticity</h3>
                      <div className="grid gap-3">
                        {selectedPhoto.editionNumber && (
                          <div className="flex items-center text-gray-300">
                            <span>Edition: {selectedPhoto.editionNumber} of {selectedPhoto.editionSize}</span>
                          </div>
                        )}
                        {selectedPhoto.signatureType && (
                          <div className="flex items-center text-gray-300">
                            <span>Signature: {selectedPhoto.signatureType}</span>
                          </div>
                        )}
                        {selectedPhoto.certificateOfAuthenticity && (
                          <div className="flex items-center text-gray-300">
                            <span>Certificate of Authenticity Included</span>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Materials & Size */}
                    <section className="space-y-4">
                      <h3 className="text-white text-xl font-medium border-b border-gray-700 pb-2">Materials & Size</h3>
                      <div className="grid gap-3">
                        {selectedPhoto.medium && (
                          <div className="flex items-center text-gray-300">
                            <span>Medium: {selectedPhoto.medium}</span>
                          </div>
                        )}
                        {selectedPhoto.printingTechnique && (
                          <div className="flex items-center text-gray-300">
                            <span>Printing: {selectedPhoto.printingTechnique}</span>
                          </div>
                        )}
                        {selectedPhoto.paperType && (
                          <div className="flex items-center text-gray-300">
                            <span>Paper: {selectedPhoto.paperType}</span>
                          </div>
                        )}
                        {selectedPhoto.dimensions && (
                          <div className="space-y-1 text-gray-300">
                            <h4 className="text-gray-400 text-sm">Dimensions:</h4>
                            {selectedPhoto.dimensions.image && <div>Image: {selectedPhoto.dimensions.image}</div>}
                            {selectedPhoto.dimensions.paper && <div>Paper: {selectedPhoto.dimensions.paper}</div>}
                            {selectedPhoto.dimensions.framed && <div>Framed: {selectedPhoto.dimensions.framed}</div>}
                          </div>
                        )}
                        {selectedPhoto.framingOptions && selectedPhoto.framingOptions.length > 0 && (
                          <div className="text-gray-300">
                            <h4 className="text-gray-400 text-sm mb-1">Framing Options:</h4>
                            <ul className="list-disc list-inside">
                              {selectedPhoto.framingOptions.map((option, index) => (
                                <li key={index}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Context */}
                    {(selectedPhoto.artistStatement || (selectedPhoto.exhibitionHistory && selectedPhoto.exhibitionHistory.length > 0)) && (
                      <section className="space-y-4">
                        <h3 className="text-white text-xl font-medium border-b border-gray-700 pb-2">Background</h3>
                        {selectedPhoto.artistStatement && (
                          <div className="text-gray-300">
                            <h4 className="text-gray-400 text-sm mb-2">Artist Statement</h4>
                            <p className="leading-relaxed">{selectedPhoto.artistStatement}</p>
                          </div>
                        )}
                        {selectedPhoto.exhibitionHistory && selectedPhoto.exhibitionHistory.length > 0 && (
                          <div className="text-gray-300">
                            <h4 className="text-gray-400 text-sm mb-2">Exhibition History</h4>
                            <ul className="list-disc list-inside">
                              {selectedPhoto.exhibitionHistory.map((exhibition, index) => (
                                <li key={index}>{exhibition}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Tags */}
                    {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                      <section className="space-y-4">
                        <h3 className="text-white text-xl font-medium border-b border-gray-700 pb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedPhoto.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
              {/* Purchase Request Modal */}
              {purchaseModalOpen && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-gray-900 w-full max-w-lg rounded-lg p-6 relative">
                    <button
                      onClick={() => setPurchaseModalOpen(false)}
                      className="absolute top-4 right-4 text-white/50 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <h3 className="text-white text-xl font-medium mb-4">
                      Request Purchase
                    </h3>

                    {purchaseError && (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded">
                        {purchaseError}
                      </div>
                    )}

                    <form onSubmit={(e) => {
                      e.preventDefault()
                      handleRequestPurchase(selectedPhoto)
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white mb-2" htmlFor="email">
                            Your Email (optional)
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={purchaseEmail}
                            onChange={(e) => setPurchaseEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded"
                            placeholder="Enter your email address"
                          />
                        </div>

                        <div>
                          <label className="block text-white mb-2" htmlFor="message">
                            Message (optional)
                          </label>
                          <textarea
                            id="message"
                            value={purchaseMessage}
                            onChange={(e) => setPurchaseMessage(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded h-32"
                            placeholder="Add any additional information or questions..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className={`w-full ${
                            submitting 
                              ? 'bg-green-700 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white py-3 rounded-lg transition-colors`}
                        >
                          {submitting ? 'Submitting...' : 'Submit Purchase Request'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}