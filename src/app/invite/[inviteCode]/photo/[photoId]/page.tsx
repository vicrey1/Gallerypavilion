'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, ShoppingCart, MessageCircle, Share2, Eye, Calendar, MapPin, Tag, DollarSign, Award, FileText, Palette, Camera } from 'lucide-react'
import Image from 'next/image'

interface Photo {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl: string
  createdAt: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  filename: string
  editionNumber?: string
  totalEditions?: number
  medium?: string
  technique?: string
  materials?: string
  artistStatement?: string
  provenance?: string
  certificateId?: string
}

interface Gallery {
  id: string
  title: string
  description?: string
  photographer: {
    id: string
    name: string
    businessName?: string
    user: {
      email: string
    }
  }
  createdAt: string
}

interface Permissions {
  canView: boolean
  canFavorite: boolean
  canComment: boolean
  canRequestPurchase: boolean
}

export default function PhotoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showEnquiryModal, setShowEnquiryModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', message: '' })
  const [purchaseForm, setPurchaseForm] = useState({ licenseType: 'personal', name: '', email: '', notes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inviteCode = params.inviteCode as string
  const photoId = params.photoId as string

  useEffect(() => {
    const fetchPhotoDetails = async () => {
      try {
        setLoading(true)
        
        // First validate the invite
        const inviteResponse = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inviteCode }),
        })

        if (!inviteResponse.ok) {
          throw new Error('Invalid invite code')
        }

        const inviteData = await inviteResponse.json()
        setGallery(inviteData.gallery)
        setPermissions(inviteData.permissions)

        // Find the specific photo
        const foundPhoto = inviteData.gallery.photos.find((p: Photo) => p.id === photoId)
        if (!foundPhoto) {
          throw new Error('Photo not found')
        }

        setPhoto(foundPhoto)
        
        // Check if photo is already favorited
        checkIfFavorited(foundPhoto, inviteData.gallery)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load photo')
      } finally {
        setLoading(false)
      }
    }

    if (inviteCode && photoId) {
      fetchPhotoDetails()
    }
  }, [inviteCode, photoId])

  const checkIfFavorited = (photoData: Photo, galleryData: Gallery) => {
    try {
      const storageKey = `invite_favorites_${inviteCode}`
      const favoritesData = localStorage.getItem(storageKey)
      
      if (favoritesData) {
        const parsedData = JSON.parse(favoritesData)
        if (parsedData.favorites && Array.isArray(parsedData.favorites)) {
          const isFav = parsedData.favorites.some((fav: { id: string }) => fav.id === photoData.id)
          setIsFavorited(isFav)
        }
      }
    } catch (error) {
      console.error('Error checking favorites:', error)
    }
  }

  const handleBack = () => {
    router.push(`/invite/${inviteCode}`)
  }

  const handleFavorite = () => {
    if (permissions?.canFavorite && photo && gallery) {
      const newFavoriteState = !isFavorited
      setIsFavorited(newFavoriteState)
      
      try {
        const storageKey = `invite_favorites_${inviteCode}`
        let favoritesData: {
          favorites: any[],
          addedAt: string
        } = {
          favorites: [],
          addedAt: new Date().toISOString()
        }
        
        // Get existing favorites
        const existingData = localStorage.getItem(storageKey)
        if (existingData) {
          favoritesData = JSON.parse(existingData)
          if (!favoritesData.favorites) {
            favoritesData.favorites = []
          }
        }
        
        if (newFavoriteState) {
          // Add to favorites
          const favoritePhoto = {
            id: photo.id,
            title: photo.title,
            description: photo.description,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl,
            price: photo.price,
            isForSale: photo.isForSale,
            gallery: {
              id: gallery.id,
              title: gallery.title,
              photographer: {
                id: gallery.photographer.id,
                name: gallery.photographer.name,
                businessName: gallery.photographer.businessName,
                user: {
                  email: gallery.photographer.user.email
                }
              }
            }
          }
          
          // Check if not already in favorites
          const exists = favoritesData.favorites.some((fav: { id: string }) => fav.id === photo.id)
          if (!exists) {
            favoritesData.favorites.push(favoritePhoto)
            favoritesData.addedAt = new Date().toISOString()
          }
        } else {
          // Remove from favorites
          favoritesData.favorites = favoritesData.favorites.filter((fav: { id: string }) => fav.id !== photo.id)
        }
        
        localStorage.setItem(storageKey, JSON.stringify(favoritesData))
      } catch (error) {
        console.error('Error updating favorites:', error)
        // Revert the state if there was an error
        setIsFavorited(!newFavoriteState)
      }
    }
  }



  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gallery || !photo) return

    setIsSubmitting(true)
    try {
      const subject = `Enquiry about photo: ${photo.title}`
      const body = `Hi ${gallery.photographer.name},\n\nI'm interested in the photo "${photo.title}" from your gallery "${gallery.title}".\n\nMy enquiry:\n${enquiryForm.message}\n\nPlease get back to me at your earliest convenience.\n\nBest regards,\n${enquiryForm.name}\n${enquiryForm.email}`
      
      const mailtoLink = `mailto:${gallery.photographer.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoLink, '_blank')
      
      setShowEnquiryModal(false)
      setEnquiryForm({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Error sending enquiry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gallery || !photo) return

    setIsSubmitting(true)
    try {
      const subject = `Purchase request for photo: ${photo.title}`
      const body = `Hi ${gallery.photographer.name},\n\nI would like to purchase the photo "${photo.title}" from your gallery "${gallery.title}".\n\nDetails:\n- License Type: ${purchaseForm.licenseType}\n- Price: ${photo.price ? '$' + photo.price.toFixed(2) : 'On Request'}\n- Customer: ${purchaseForm.name}\n- Email: ${purchaseForm.email}\n\nAdditional notes:\n${purchaseForm.notes}\n\nPlease let me know the next steps for completing this purchase.\n\nBest regards,\n${purchaseForm.name}`

      const recipient = gallery.photographer?.user?.email
      if (!recipient) {
        alert('Photographer contact email is not available')
        return
      }
      const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailtoLink

      setShowPurchaseModal(false)
      setPurchaseForm({ licenseType: 'personal', name: '', email: '', notes: '' })
    } catch (error) {
      console.error('Error sending purchase request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }



  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo?.title || 'Photo',
          text: photo?.description || 'Check out this photo',
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!photo || !gallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Photo Not Found</h1>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back to Gallery
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Gallery</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">{gallery.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photo Display */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={photo.url}
                  alt={photo.title || 'Photo'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-center space-x-4 mt-6"
            >
              {permissions?.canFavorite && (
                <button
                  onClick={handleFavorite}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isFavorited
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                </button>
              )}

              <button
                onClick={() => window.open(`mailto:${gallery?.photographer.user.email}?subject=Certificate of Authenticity Request: ${photo?.title}&body=Hello, I would like to request the certificate of authenticity for the artwork "${photo?.title}" (Edition ${photo?.editionNumber || '1'} of ${photo?.totalEditions || '1'}). Certificate ID: ${photo?.certificateId || 'TBD'}.`, '_blank')}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Award className="h-5 w-5" />
                <span>Certificate of Authenticity</span>
              </button>

              {permissions?.canRequestPurchase && photo.isForSale && (
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Acquire Original</span>
                </button>
              )}

              <button
                onClick={() => setShowEnquiryModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Enquiry</span>
              </button>
            </motion.div>
          </div>

          {/* Photo Details */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {photo.title || 'Untitled'}
              </h2>
              
              {photo.description && (
                <p className="text-gray-600 mb-6">{photo.description}</p>
              )}

              {/* About the Work Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  About the Work
                </h3>
                <div className="space-y-3">
                  {photo.artistStatement && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1 text-sm">Artist Statement</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{photo.artistStatement}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1 text-sm">Technique</h4>
                      <p className="text-gray-600 text-sm">{photo.technique || 'Traditional Photogram Process'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1 text-sm">Materials</h4>
                      <p className="text-gray-600 text-sm">{photo.materials || 'Silver Gelatin Print on Fiber Paper'}</p>
                    </div>
                  </div>
                  
                  {photo.provenance && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1 text-sm">Provenance</h4>
                      <p className="text-gray-600 text-sm">{photo.provenance}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photogram Process Information */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Camera className="h-4 w-4 mr-2" />
                  Photogram Process
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                  This unique artwork is created through the traditional photogram technique, where objects are placed directly onto photographic paper and exposed to light, creating a one-of-a-kind silhouette without the use of a camera.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Each photogram is a physical manifestation of light and shadow, making every piece truly unique and unrepeatable. The process connects directly to the origins of photography, creating tangible art that exists only in its physical form.
                </p>
              </div>

              {/* Pricing */}
              {photo.isForSale && photo.price && (
                <div className="flex items-center space-x-2 mb-6 p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    ${photo.price.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Photo Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Details</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>

                  {photo.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{photo.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Edition {photo.editionNumber || '1'} of {photo.totalEditions || '1'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Palette className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {photo.medium || 'Photographic Print'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {Array.isArray(photo.tags) && photo.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Photographer Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photographer</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {gallery.photographer.businessName || gallery.photographer.name}
                </p>
                <p className="text-sm text-gray-600">
                  {gallery.photographer.user.email}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Enquiry</h3>
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Your enquiry about this photo..."
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEnquiryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Enquiry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Photo</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{photo.title}</h4>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ${photo.price?.toFixed(2)}
                </p>
              </div>
              <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Type
                  </label>
                  <select 
                    value={purchaseForm.licenseType}
                    onChange={(e) => setPurchaseForm({...purchaseForm, licenseType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="personal">Personal Use</option>
                    <option value="commercial">Commercial Use</option>
                    <option value="editorial">Editorial Use</option>
                    <option value="extended">Extended License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.name}
                    onChange={(e) => setPurchaseForm({...purchaseForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={purchaseForm.email}
                    onChange={(e) => setPurchaseForm({...purchaseForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Any additional requirements or notes..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Request Purchase'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}