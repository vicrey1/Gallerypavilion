'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowLeft, Grid, List, Search, Filter, Plus, X, Heart, Download, Share, Edit, Trash2, Eye, EyeOff, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Photo {
  id: string
  title: string
  description?: string
  filename: string
  thumbnailUrl: string
  fullUrl: string
  price: number
  photographer: {
    id: string
    name: string
    username: string
  }
  gallery: {
    id: string
    title: string
  }
}

interface Collection {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  userId: string
  user: {
    id: string
    name: string
    username: string
  }
  photos: {
    id: string
    addedAt: string
    photo: Photo
  }[]
}

export default function CollectionDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const collectionId = params.collectionId as string
  
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  useEffect(() => {
    if (collectionId) {
      fetchCollection()
    }
  }, [collectionId])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/collections/${collectionId}`)
      if (response.ok) {
        const data = await response.json()
        setCollection(data.collection)
        setEditData({
          name: data.collection.name,
          description: data.collection.description || '',
          isPublic: data.collection.isPublic
        })
      } else if (response.status === 404) {
        setError('Collection not found')
      } else if (response.status === 403) {
        setError('You do not have permission to view this collection')
      } else {
        setError('Failed to fetch collection')
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      setError('Failed to fetch collection')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePhotos = async () => {
    try {
      setLoadingPhotos(true)
      // This would need to be implemented - fetch photos that can be added to collection
      // For now, we'll use a placeholder
      setAvailablePhotos([])
    } catch (error) {
      console.error('Error fetching available photos:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const updateCollection = async () => {
    if (!editData.name.trim()) return

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        const data = await response.json()
        setCollection(prev => prev ? { ...prev, ...data.collection } : null)
        setShowEditModal(false)
      } else {
        setError('Failed to update collection')
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      setError('Failed to update collection')
    }
  }

  const removePhotoFromCollection = async (photoId: string) => {
    if (!confirm('Remove this photo from the collection?')) return

    try {
      const response = await fetch(`/api/collections/${collectionId}/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photoId })
      })

      if (response.ok) {
        setCollection(prev => prev ? {
          ...prev,
          photos: prev.photos.filter(p => p.photo.id !== photoId)
        } : null)
      } else {
        setError('Failed to remove photo from collection')
      }
    } catch (error) {
      console.error('Error removing photo:', error)
      setError('Failed to remove photo')
    }
  }

  const addPhotosToCollection = async (photoIds: string[]) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photoIds })
      })

      if (response.ok) {
        // Refresh collection to get updated photos
        fetchCollection()
        setShowAddPhotosModal(false)
        setSelectedPhotos(new Set())
      } else {
        setError('Failed to add photos to collection')
      }
    } catch (error) {
      console.error('Error adding photos:', error)
      setError('Failed to add photos')
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const filteredPhotos = collection?.photos.filter(item => {
    const photo = item.photo
    return photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           photo.photographer.name.toLowerCase().includes(searchTerm.toLowerCase())
  }) || []

  const isOwner = session?.user?.id === collection?.userId

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading collection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/collections" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Back to Collections
          </Link>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <Link href="/collections" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Back to Collections
          </Link>
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
                href="/collections"
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Collections</span>
              </Link>
              
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white truncate">{collection.name}</h1>
                  {collection.isPublic ? (
                    <Eye className="h-4 w-4 text-green-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-300 text-sm">{collection.photos.length} photos</p>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/collections"
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Collections</span>
              </Link>
              <div className="text-gray-300">•</div>
              <div className="flex items-center space-x-3">
                <Camera className="h-6 w-6 text-purple-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold text-white">{collection.name}</h1>
                    {collection.isPublic ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{collection.photos.length} photos • by {collection.user.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setShowAddPhotosModal(true)
                      fetchAvailablePhotos()
                    }}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Photos</span>
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Collection Description */}
        {collection.description && (
          <div className="mb-8">
            <p className="text-gray-300 text-lg">{collection.description}</p>
          </div>
        )}

        {/* Mobile Add Photos Button */}
        {isOwner && (
          <div className="block sm:hidden mb-6">
            <button
              onClick={() => {
                setShowAddPhotosModal(true)
                fetchAvailablePhotos()
              }}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Photos to Collection</span>
            </button>
          </div>
        )}

        {/* Search and View Controls */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search photos in collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            {/* View Mode */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid/List */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No photos found' : 'No photos in collection'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add some photos to get started'
              }
            </p>
            {!searchTerm && isOwner && (
              <button
                onClick={() => {
                  setShowAddPhotosModal(true)
                  fetchAvailablePhotos()
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Add Photos
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredPhotos.map((item) => {
              const photo = item.photo
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={viewMode === 'grid'
                    ? 'bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-colors group'
                    : 'bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors group'
                  }
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Photo Image */}
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={photo.thumbnailUrl || 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop'}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Link
                            href={`/gallery/${photo.gallery.id}?photo=${photo.id}`}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {isOwner && (
                            <button
                              onClick={() => removePhotoFromCollection(photo.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-white p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Photo Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1 truncate">{photo.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">by {photo.photographer.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-400 font-semibold">${photo.price}</span>
                          <Link
                            href={`/gallery/${photo.gallery.id}?photo=${photo.id}`}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4">
                      {/* Photo Thumbnail */}
                      <div className="w-20 h-20 relative overflow-hidden rounded-lg flex-shrink-0">
                        <Image
                          src={photo.thumbnailUrl || 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=80&h=80&fit=crop'}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Photo Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">{photo.title}</h3>
                        <p className="text-gray-400 text-sm mb-1">by {photo.photographer.name}</p>
                        <p className="text-gray-400 text-sm mb-2">from {photo.gallery.title}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-purple-400 font-semibold">${photo.price}</span>
                          <Link
                            href={`/gallery/${photo.gallery.id}?photo=${photo.id}`}
                            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                          >
                            View Photo →
                          </Link>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/gallery/${photo.gallery.id}?photo=${photo.id}`}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isOwner && (
                          <button
                            onClick={() => removePhotoFromCollection(photo.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Edit Collection</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter collection name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={editData.isPublic}
                    onChange={(e) => setEditData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="editIsPublic" className="text-sm text-gray-300">
                    Make this collection public
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateCollection}
                  disabled={!editData.name.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Photos Modal */}
      <AnimatePresence>
        {showAddPhotosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddPhotosModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Add Photos to Collection</h2>
                <button
                  onClick={() => setShowAddPhotosModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Photo Selection Coming Soon</h3>
                <p className="text-gray-400 mb-6">
                  The ability to browse and add photos from your galleries will be available soon.
                </p>
                <button
                  onClick={() => setShowAddPhotosModal(false)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}