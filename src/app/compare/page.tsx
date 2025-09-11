'use client'

import { useState, useEffect, Suspense } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  X, 
  Plus, 
  Eye, 
  Heart, 
  Download, 
  ShoppingCart, 
  Star, 
  Calendar, 
  MapPin, 
  Camera, 
  Maximize2, 
  Grid3X3, 
  RotateCcw
} from 'lucide-react'

interface Photo {
  id: string
  title: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  price: number
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  location?: string
  isForSale: boolean
  orientation?: 'landscape' | 'portrait' | 'square'
  views: number
  downloads: number
  likes: number
  photographer: {
    id: string
    name: string
    email: string
  }
  dimensions: {
    width: number
    height: number
  }
  fileSize: string
  format: string
}

function PhotoComparisonPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'side-by-side'>('side-by-side')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const photoIds = searchParams.get('photos')?.split(',') || []
    if (photoIds.length > 0) {
      fetchPhotos(photoIds)
    }
    fetchAvailablePhotos()
  }, [searchParams])

  const fetchPhotos = async (photoIds: string[]) => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockPhotos: Photo[] = photoIds.map((id, index) => ({
        id,
        title: `Photo ${index + 1}`,
        description: `Beautiful photo ${index + 1} description`,
        imageUrl: `https://images.unsplash.com/photo-${['1594736797933-d0401ba2fe65', '1606216794074-735e91aa2c92', '1469371670807-013ccf25f16a', '1606800052052-a08af7148866'][index % 4]}?w=800&h=600&fit=crop`,
        thumbnailUrl: `https://images.unsplash.com/photo-${['1594736797933-d0401ba2fe65', '1606216794074-735e91aa2c92', '1469371670807-013ccf25f16a', '1606800052052-a08af7148866'][index % 4]}?w=400&h=300&fit=crop`,
        price: 25 + (index * 10),
        category: ['landscape', 'portrait', 'nature'][index % 3],
        tags: ['nature', 'beautiful', 'professional'],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        location: 'New York',
        isForSale: true,
        orientation: ['landscape', 'portrait', 'square'][index % 3] as any,
        views: 1250 + (index * 100),
        downloads: 45 + (index * 5),
        likes: 89 + (index * 10),
        photographer: {
          id: 'photographer-1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        dimensions: {
          width: 4000,
          height: 3000
        },
        fileSize: '12.5 MB',
        format: 'JPEG'
      }))

      setPhotos(mockPhotos)
    } catch (err) {
      setError('Failed to load photos for comparison')
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePhotos = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAvailablePhotos: Photo[] = Array.from({ length: 20 }, (_, index) => ({
        id: `available-${index + 1}`,
        title: `Available Photo ${index + 1}`,
        description: `Description for photo ${index + 1}`,
        imageUrl: `https://images.unsplash.com/photo-${['1594736797933-d0401ba2fe65', '1606216794074-735e91aa2c92', '1469371670807-013ccf25f16a', '1606800052052-a08af7148866', '1519741497674-611481863552', '1511285560929-80b456fea0bc', '1583939003579-730e3918a45a', '1465495976277-4387d4b0e4a6', '1464207687429-7505649dae38', '1511795409834-ef04bbd61622'][index % 10]}?w=800&h=600&fit=crop`,
        thumbnailUrl: `https://images.unsplash.com/photo-${['1594736797933-d0401ba2fe65', '1606216794074-735e91aa2c92', '1469371670807-013ccf25f16a', '1606800052052-a08af7148866', '1519741497674-611481863552', '1511285560929-80b456fea0bc', '1583939003579-730e3918a45a', '1465495976277-4387d4b0e4a6', '1464207687429-7505649dae38', '1511795409834-ef04bbd61622'][index % 10]}?w=400&h=300&fit=crop`,
        price: 20 + (index * 5),
        category: ['landscape', 'portrait', 'nature', 'wedding'][index % 4],
        tags: ['nature', 'beautiful', 'professional'],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        location: 'Various',
        isForSale: true,
        orientation: ['landscape', 'portrait', 'square'][index % 3] as any,
        views: 800 + (index * 50),
        downloads: 30 + (index * 3),
        likes: 60 + (index * 8),
        photographer: {
          id: 'photographer-1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        dimensions: {
          width: 4000,
          height: 3000
        },
        fileSize: '10.2 MB',
        format: 'JPEG'
      }))

      setAvailablePhotos(mockAvailablePhotos)
    } catch (err) {
      console.error('Error fetching available photos:', err)
    }
  }

  const addPhotoToComparison = (photo: Photo) => {
    if (photos.length >= 4) {
      alert('You can compare up to 4 photos at once')
      return
    }

    if (photos.find(p => p.id === photo.id)) {
      alert('This photo is already in the comparison')
      return
    }

    const newPhotos = [...photos, photo]
    setPhotos(newPhotos)
    updateURL(newPhotos)
    setShowAddModal(false)
  }

  const removePhotoFromComparison = (photoId: string) => {
    const newPhotos = photos.filter(p => p.id !== photoId)
    setPhotos(newPhotos)
    updateURL(newPhotos)
  }

  const updateURL = (newPhotos: Photo[]) => {
    const photoIds = newPhotos.map(p => p.id).join(',')
    const newURL = photoIds ? `/compare?photos=${photoIds}` : '/compare'
    window.history.replaceState({}, '', newURL)
  }

  const clearComparison = () => {
    setPhotos([])
    updateURL([])
  }

  const filteredAvailablePhotos = availablePhotos.filter(photo =>
    photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading comparison...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Photo Comparison</h1>
                <p className="text-gray-400 text-sm">
                  {photos.length} of 4 photos selected
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'side-by-side'
                      ? 'bg-white/20 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white/20 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Photo</span>
              </button>
              
              {photos.length > 0 && (
                <button
                  onClick={clearComparison}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Photos to Compare</h2>
            <p className="text-gray-400 mb-6">Add photos to start comparing them side by side</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Photo
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : photos.length === 1 ? 'grid-cols-1'
              : photos.length === 2 ? 'grid-cols-1 lg:grid-cols-2'
              : photos.length === 3 ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
          }`}>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Photo Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="text-white font-medium truncate">{photo.title}</h3>
                  <button
                    onClick={() => removePhotoFromComparison(photo.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Photo Image */}
                <div className="relative aspect-[4/3] group">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                  
                  {/* Fullscreen Button */}
                  <button
                    onClick={() => {
                      setSelectedPhoto(photo)
                      setShowFullscreen(true)
                    }}
                    className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  {/* Stats */}
                  <div className="absolute bottom-2 left-2 flex space-x-2">
                    <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{photo.views}</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{photo.likes}</span>
                    </div>
                  </div>
                </div>
                
                {/* Photo Details */}
                <div className="p-4 space-y-4">
                  {/* Basic Info */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">{photo.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{photo.dimensions.width} × {photo.dimensions.height}</span>
                      <span>{photo.fileSize}</span>
                      <span>{photo.format}</span>
                    </div>
                  </div>
                  
                  {/* Pricing */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-white font-medium mb-2">Pricing</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white font-bold">${photo.price}</span>
                    </div>
                  </div>
                  
                  {/* Metadata */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Camera className="w-4 h-4" />
                      <span>{photo.photographer.name}</span>
                    </div>
                    {photo.location && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{photo.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/gallery/${photo.photographer.id}/photo/${photo.id}`}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </Link>
                    <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Photo Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-white/20 w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">Add Photo to Comparison</h2>
                  <p className="text-gray-400 text-sm">Select up to {4 - photos.length} more photos</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Search */}
              <div className="p-6 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Photo Grid */}
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredAvailablePhotos.map((photo) => {
                    const isAlreadySelected = photos.find(p => p.id === photo.id)
                    const canAdd = photos.length < 4 && !isAlreadySelected
                    
                    return (
                      <div
                        key={photo.id}
                        className={`relative group cursor-pointer ${
                          isAlreadySelected ? 'opacity-50' : ''
                        }`}
                        onClick={() => canAdd && addPhotoToComparison(photo)}
                      >
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                          <Image
                            src={photo.thumbnailUrl}
                            alt={photo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Overlay */}
                          <div className={`absolute inset-0 transition-colors duration-300 ${
                            canAdd 
                              ? 'bg-black/0 group-hover:bg-black/40'
                              : 'bg-black/60'
                          }`} />
                          
                          {/* Add Button */}
                          {canAdd && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-purple-600 text-white p-2 rounded-full">
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                          
                          {/* Already Selected */}
                          {isAlreadySelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                                Selected
                              </div>
                            </div>
                          )}
                          
                          {/* Price */}
                          <div className="absolute bottom-2 left-2">
                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                              ${photo.price}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <h3 className="text-white text-sm font-medium truncate">{photo.title}</h3>
                          <p className="text-gray-400 text-xs truncate">{photo.photographer.name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => setShowFullscreen(false)}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <h3 className="text-white text-xl font-bold">{selectedPhoto.title}</h3>
              <p className="text-gray-300">{selectedPhoto.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PhotoComparisonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <PhotoComparisonPageContent />
    </Suspense>
  )
}