'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Grid, List, Eye, Heart, Share, Edit, Trash2, ArrowLeft, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Collection {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  _count: {
    photos: number
  }
  photos?: {
    photo: {
      id: string
      title: string
      filename: string
      thumbnailUrl: string
      price: number
    }
  }[]
}

export default function CollectionsPage() {
  const { data: session, status } = useSession()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all')
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  useEffect(() => {
    if (session) {
      fetchCollections()
    }
  }, [session])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collections?includePhotos=true')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections)
      } else {
        setError('Failed to fetch collections')
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      setError('Failed to fetch collections')
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async () => {
    if (!newCollection.name.trim()) return

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCollection)
      })

      if (response.ok) {
        const data = await response.json()
        setCollections(prev => [data.collection, ...prev])
        setNewCollection({ name: '', description: '', isPublic: false })
        setShowCreateModal(false)
      } else {
        setError('Failed to create collection')
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      setError('Failed to create collection')
    }
  }

  const updateCollection = async () => {
    if (!selectedCollection || !selectedCollection.name.trim()) return

    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedCollection.name,
          description: selectedCollection.description,
          isPublic: selectedCollection.isPublic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCollections(prev => 
          prev.map(col => col.id === selectedCollection.id ? { ...col, ...data.collection } : col)
        )
        setShowEditModal(false)
        setSelectedCollection(null)
      } else {
        setError('Failed to update collection')
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      setError('Failed to update collection')
    }
  }

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCollections(prev => prev.filter(col => col.id !== collectionId))
      } else {
        setError('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      setError('Failed to delete collection')
    }
  }

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterPublic === 'all' ||
                         (filterPublic === 'public' && collection.isPublic) ||
                         (filterPublic === 'private' && !collection.isPublic)
    
    return matchesSearch && matchesFilter
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-white mx-auto mb-4" style={{borderBottomWidth: '2px'}}></div>
          <p>Loading collections...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-300 mb-6">You need to be signed in to view your collections.</p>
          <Link href="/auth/signin" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Sign In
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
                href="/dashboard"
                className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-white">My Collections</h1>
                <p className="text-gray-300 text-sm">{collections.length} collections</p>
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
              <div className="text-gray-300">•</div>
              <div className="flex items-center space-x-3">
                <Camera className="h-6 w-6 text-purple-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">My Collections</h1>
                  <p className="text-gray-300 text-sm">{collections.length} collections</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Collection</span>
            </button>
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

        {/* Mobile Create Button */}
        <div className="block sm:hidden mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Collection</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            {/* Filter */}
            <select
              value={filterPublic}
              onChange={(e) => setFilterPublic(e.target.value as 'all' | 'public' | 'private')}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Collections</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            
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

        {/* Collections Grid/List */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterPublic !== 'all' ? 'No collections found' : 'No collections yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterPublic !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first collection to organize your favorite photos'
              }
            </p>
            {!searchTerm && filterPublic === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredCollections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={viewMode === 'grid'
                  ? 'bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-colors'
                  : 'bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors'
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Collection Thumbnail */}
                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                      {collection.photos && collection.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 h-full">
                          {collection.photos.slice(0, 4).map((item, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={item.photo.thumbnailUrl || 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop'}
                                alt={item.photo.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Collection Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white truncate flex-1">{collection.name}</h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {collection.isPublic && (
                            <Eye className="w-4 h-4 text-green-400" />
                          )}
                          <button
                            onClick={() => {
                              setSelectedCollection(collection)
                              setShowEditModal(true)
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {collection.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{collection.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{collection._count.photos} photos</span>
                        <Link
                          href={`/collections/${collection.id}`}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    {/* Collection Thumbnail */}
                    <div className="w-20 h-20 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
                      {collection.photos && collection.photos.length > 0 ? (
                        <Image
                          src={collection.photos[0].photo.thumbnailUrl || 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=80&h=80&fit=crop'}
                          alt={collection.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Collection Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{collection.name}</h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {collection.isPublic && (
                            <Eye className="w-4 h-4 text-green-400" />
                          )}
                          <button
                            onClick={() => {
                              setSelectedCollection(collection)
                              setShowEditModal(true)
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {collection.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-1">{collection.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{collection._count.photos} photos</span>
                        <Link
                          href={`/collections/${collection.id}`}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          View Collection →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Create New Collection</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter collection name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newCollection.isPublic}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-300">
                    Make this collection public
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCollection}
                  disabled={!newCollection.name.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Collection Modal */}
      <AnimatePresence>
        {showEditModal && selectedCollection && (
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
                    value={selectedCollection.name}
                    onChange={(e) => setSelectedCollection(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter collection name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedCollection.description || ''}
                    onChange={(e) => setSelectedCollection(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={selectedCollection.isPublic}
                    onChange={(e) => setSelectedCollection(prev => prev ? { ...prev, isPublic: e.target.checked } : null)}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="editIsPublic" className="text-sm text-gray-300">
                    Make this collection public
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCollection(null)
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateCollection}
                  disabled={!selectedCollection.name.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}