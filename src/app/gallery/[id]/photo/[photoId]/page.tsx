'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Award, Star, DollarSign, Mail, Share, Eye, Calendar, Camera, MapPin, Tag, FileText, Palette } from 'lucide-react'
import ReviewSection from '@/components/ReviewSection'
import CertificateModal from '@/components/CertificateModal'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

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
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  editionNumber?: number
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
    email: string
  }
}

export default function PhotoDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const galleryId = params.id as string
  const photoId = params.photoId as string

  const [photo, setPhoto] = useState<Photo | null>(null)
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLicense, setSelectedLicense] = useState('standard')
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)

  useEffect(() => {
    fetchPhotoDetails()
    checkWishlistStatus()
  }, [photoId, galleryId, session])

  const checkWishlistStatus = async () => {
    if (!session?.user?.email || !photoId) return
    
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        const isPhotoInWishlist = data.wishlist.some((item: { id: string }) => item.id === photoId)
        setIsInWishlist(isPhotoInWishlist)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  const fetchPhotoDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch gallery details
      const galleryResponse = await fetch(`/api/photographer/galleries/${galleryId}`)
      if (!galleryResponse.ok) {
        throw new Error('Failed to fetch gallery')
      }
      const galleryData = await galleryResponse.json()
      setGallery(galleryData)
      
      // Find photo in gallery
      const photoData = galleryData.photos.find((p: Photo) => p.id === photoId)
      if (!photoData) {
        throw new Error('Photo not found')
      }
      setPhoto(photoData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyPhoto = () => {
    if (!photo || !gallery || !gallery.photographer) return
    
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

  const toggleWishlist = async () => {
    if (!session?.user?.email) {
      // Redirect to login or show login modal
      router.push('/auth/signin')
      return
    }

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?photoId=${photoId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setIsInWishlist(false)
        } else {
          console.error('Failed to remove from wishlist')
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ photoId })
        })
        
        if (response.ok) {
          setIsInWishlist(true)
        } else {
          const errorData = await response.json()
          console.error('Failed to add to wishlist:', errorData.error)
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const logBytes = Math.log(bytes)
    const logK = Math.log(k)
    const i = Math.floor(logBytes / logK)
    const value = bytes / (Math.pow(k, i))
    return parseFloat(value.toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading photo...</p>
        </div>
      </div>
    )
  }
  if (error || !photo || !gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Photo Not Found</h1>
          <p className="text-gray-300 mb-6">{error || 'The requested photo could not be found.'}</p>
          <Link href={`/gallery/${galleryId}`} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Back to Gallery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile Navigation */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between">
              <Link 
                href={`/gallery/${galleryId}`}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowFullImage(true)}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-colors active:scale-95"
                >
                  <Eye className="h-4 w-4" />
                </button>
                
                <button
                  onClick={toggleWishlist}
                  className={`p-3 rounded-lg transition-colors active:scale-95 ${
                    isInWishlist ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <Link 
              href={`/gallery/${galleryId}`}
              className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Gallery</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowFullImage(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Full View</span>
              </button>
              
              <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                <Share className="h-4 w-4" />
              </button>
              
              <button
                onClick={toggleWishlist}
                className={`p-2 rounded-lg transition-colors ${
                  isInWishlist ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Photo Display */}
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm border border-white/10 cursor-pointer"
              onClick={() => setShowFullImage(true)}
            >
              <Image
                src={photo.url}
                alt={photo.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="bg-black/50 text-white p-3 rounded-full">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
            
            {/* Photo Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-white/10">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm sm:text-base">{photo.favorites}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Favorites</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-white/10">
                <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm sm:text-base">Original</p>
                <p className="text-gray-400 text-xs sm:text-sm">Physical Art</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center border border-white/10">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm sm:text-base" suppressHydrationWarning>{(Math.random() * 2 + 3).toFixed(1)}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Rating</p>
              </div>
            </div>
          </div>

          {/* Photo Details & Purchase */}
          <div className="space-y-4 sm:space-y-6">
            {/* Photo Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{photo.title}</h1>
              
              {photo.description && (
                <p className="text-gray-300 mb-6 leading-relaxed">{photo.description}</p>
              )}
              
              {/* Tags */}
              {photo.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map(tag => (
                      <span key={tag} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Photo Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Camera className="h-4 w-4" />
                  <span>{photo.medium || 'Photogram'}</span>
                </div>
                {photo.category && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Tag className="h-4 w-4" />
                    <span>{photo.category}</span>
                  </div>
                )}
                {(photo.editionNumber && photo.totalEditions) && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Award className="h-4 w-4" />
                    <span>Edition {photo.editionNumber}/{photo.totalEditions}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Purchase Section */}
            {photo.isForSale && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Purchase Photo</span>
                </h2>
                
                {/* Price Display */}
                <div className="mb-6">
                  {photo.price && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Photo License</p>
                          <p className="text-gray-400 text-sm">Full commercial and personal use</p>
                        </div>
                        <span className="text-white font-bold text-xl">${photo.price}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={handleBuyPhoto}
                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Acquire Original</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Certificate of Authenticity</span>
                  </button>
                  
                  <button
                    onClick={toggleWishlist}
                    className={`sm:px-6 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 active:scale-95 ${
                      isInWishlist 
                        ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white' 
                        : 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                    <span className="sm:inline">{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                </div>
              </motion.div>
            )}
            
            {!photo.isForSale && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 text-center"
              >
                <p className="text-gray-400 mb-4">This photo is not available for purchase</p>
                <button
                  onClick={toggleWishlist}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto active:scale-95 ${
                    isInWishlist 
                      ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white' 
                      : 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                  <span>{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* About the Work Section */}
        {(photo.artistStatement || photo.technique || photo.materials || photo.provenance) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>About the Work</span>
            </h2>
            
            <div className="space-y-6">
              {photo.artistStatement && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Artist Statement</h3>
                  <p className="text-gray-300 leading-relaxed">{photo.artistStatement}</p>
                </div>
              )}
              
              {photo.technique && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Technique</h3>
                  <p className="text-gray-300">{photo.technique}</p>
                </div>
              )}
              
              {photo.materials && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Materials</h3>
                  <p className="text-gray-300">{photo.materials}</p>
                </div>
              )}
              
              {photo.provenance && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Provenance</h3>
                  <p className="text-gray-300">{photo.provenance}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Photogram Process Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Camera className="h-6 w-6" />
            <span>Photogram Process Information</span>
          </h2>
          
          <div className="text-gray-300 leading-relaxed space-y-4">
            <p>
              This artwork is a photogram, a unique photographic process that creates images without using a camera. 
              Objects are placed directly onto photographic paper and exposed to light, creating a silhouette-like image.
            </p>
            <p>
              Each photogram is a one-of-a-kind original artwork, as the exact positioning and exposure can never be 
              perfectly replicated. This makes every piece in the edition unique while maintaining the artistic vision.
            </p>
            <p>
              The process connects directly to the origins of photography, making each work both contemporary art and 
              a celebration of photographic history.
            </p>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewSection photoId={photoId} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10" />
        </div>
        
        {/* Certificate Modal */}
        <CertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          photoId={photoId}
          photoTitle={photo?.title || 'Untitled'}
          photographerName={gallery?.photographer.name || 'Unknown Artist'}
        />
      </div>
      
      {/* Full Image Modal */}
      {showFullImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowFullImage(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photo.url}
              alt={photo.title}
              width={1200}
              height={800}
              className="object-contain max-h-[90vh] w-auto"
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 text-white p-3 sm:p-2 rounded-full hover:bg-black/70 transition-colors text-xl sm:text-base active:scale-95"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}