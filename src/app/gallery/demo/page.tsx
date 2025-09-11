'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowLeft, Heart, Download, ShoppingCart, Search, Grid, List, X, ZoomIn, Filter } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Types
interface Photo {
  id: string
  url: string
  thumbnail: string
  title: string
  tags: string[]
}

interface PurchaseModalData {
  photo: Photo
  licenseType?: string
}

// Mock data for demo gallery
const mockGallery = {
  id: '1',
  title: 'Sarah & Michael Wedding',
  photographer: 'Emma Rodriguez Photography',
  description: 'A beautiful celebration of love at Sunset Manor',
  collections: [
    {
      id: '1',
      title: 'Getting Ready',
      description: 'Preparation moments before the ceremony',
      photos: [
        { id: '1', url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop', title: 'Bridal preparations', tags: ['bride', 'preparation', 'details'] },
        { id: '2', url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=300&h=200&fit=crop', title: 'Wedding dress details', tags: ['dress', 'details', 'bride'] },
        { id: '3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop', title: 'Groom getting ready', tags: ['groom', 'preparation'] },
        { id: '4', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&h=200&fit=crop', title: 'Bridal bouquet', tags: ['flowers', 'bouquet', 'details'] },
      ]
    },
    {
      id: '2',
      title: 'Ceremony',
      description: 'The sacred moments of your vows',
      photos: [
        { id: '5', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=200&fit=crop', title: 'Walking down the aisle', tags: ['ceremony', 'bride', 'aisle'] },
        { id: '6', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=200&fit=crop', title: 'Exchange of vows', tags: ['ceremony', 'vows', 'couple'] },
        { id: '7', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&h=200&fit=crop', title: 'Ring exchange', tags: ['ceremony', 'rings', 'hands'] },
        { id: '8', url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=300&h=200&fit=crop', title: 'First kiss', tags: ['ceremony', 'kiss', 'couple'] },
        { id: '9', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=300&h=200&fit=crop', title: 'Celebration', tags: ['ceremony', 'celebration', 'guests'] },
      ]
    },
    {
      id: '3',
      title: 'Reception',
      description: 'Dancing, dining, and celebration',
      photos: [
        { id: '10', url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300&h=200&fit=crop', title: 'First dance', tags: ['reception', 'dance', 'couple'] },
        { id: '11', url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300&h=200&fit=crop', title: 'Cake cutting', tags: ['reception', 'cake', 'couple'] },
        { id: '12', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop', thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=200&fit=crop', title: 'Reception party', tags: ['reception', 'party', 'guests'] },
      ]
    }
  ]
}

export default function GalleryPage() {
  const [selectedCollection, setSelectedCollection] = useState(mockGallery.collections[0])
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPurchaseModal, setShowPurchaseModal] = useState<PurchaseModalData | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all photos from selected collection
  const allPhotos = selectedCollection.photos
  
  // Filter photos based on search and tags
  const filteredPhotos = allPhotos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTag = !selectedTag || photo.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  // Get all unique tags from current collection
  const allTags = Array.from(new Set(allPhotos.flatMap(photo => photo.tags)))

  const toggleFavorite = (photoId: string) => {
    setFavorites(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const handlePurchaseRequest = (photo: Photo, licenseType: string) => {
    // Simulate purchase request
    alert(`Purchase request submitted for "${photo.title}" with ${licenseType} license. The photographer will contact you soon.`)
    setShowPurchaseModal(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-white">Gallery Pavilion</span>
            </Link>
            <div className="text-gray-300">•</div>
            <div className="text-white">
              <h1 className="font-semibold">{mockGallery.title}</h1>
              <p className="text-sm text-gray-300">{mockGallery.photographer}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{favorites.length} favorites</span>
            </div>
            <Link 
              href="/invite"
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Exit Gallery</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Collections */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-r border-white/10 h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Collections</h2>
            <div className="space-y-3">
              {mockGallery.collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                    selectedCollection.id === collection.id
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">{collection.title}</h3>
                  <p className="text-sm text-gray-300 mb-2">{collection.description}</p>
                  <p className="text-xs text-gray-400">{collection.photos.length} photos</p>
                </button>
              ))}
            </div>

            {/* Favorites Section */}
            {favorites.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-400" />
                  Your Favorites
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {allPhotos
                    .filter(photo => favorites.includes(photo.id))
                    .slice(0, 6)
                    .map((photo) => (
                      <div key={photo.id} className="relative group cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                        <div className="aspect-square bg-white/10 rounded-lg overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-50"></div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))
                  }
                </div>
                {favorites.length > 6 && (
                  <p className="text-xs text-gray-400 mt-2">+{favorites.length - 6} more favorites</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Collection Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{selectedCollection.title}</h2>
            <p className="text-gray-300 mb-6">{selectedCollection.description}</p>
            
            {/* Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Tags Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              
              {/* View Mode */}
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
          </div>

          {/* Photos Grid/List */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`group relative cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center space-x-4 bg-white/5 rounded-lg p-4' : ''
                }`}
              >
                <div 
                  className={`relative overflow-hidden rounded-lg ${
                    viewMode === 'grid' ? 'aspect-[4/3]' : 'w-24 h-24 flex-shrink-0'
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {/* Placeholder for actual image */}
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-70"></div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Watermark */}
                  <div className="absolute bottom-2 right-2 text-white/50 text-xs font-mono">
                    © {mockGallery.photographer}
                  </div>
                </div>
                
                <div className={viewMode === 'list' ? 'flex-1' : 'mt-3'}>
                  <h3 className="text-white font-medium mb-1">{photo.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {photo.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className={`flex items-center space-x-2 ${
                  viewMode === 'grid' ? 'mt-2' : ''
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(photo.id)
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      favorites.includes(photo.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className="h-4 w-4" fill={favorites.includes(photo.id) ? "currentColor" : "none"} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPurchaseModal({ photo })
                    }}
                    className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      alert('Download request sent to photographer')
                    }}
                    className="p-2 rounded-full bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredPhotos.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No photos found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
              
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg aspect-[4/3] w-full max-w-4xl relative">
                {/* Watermark */}
                <div className="absolute bottom-4 right-4 text-white/70 font-mono">
                  © {mockGallery.photographer}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedPhoto.title}</h3>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => toggleFavorite(selectedPhoto.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      favorites.includes(selectedPhoto.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:text-red-400'
                    }`}
                  >
                    <Heart className="h-4 w-4" fill={favorites.includes(selectedPhoto.id) ? 'currentColor' : 'none'} />
                    <span>{favorites.includes(selectedPhoto.id) ? "Favorited" : "Add to Favorites"}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowPurchaseModal({ photo: selectedPhoto })}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Request Purchase</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPurchaseModal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Request Purchase</h3>
              <p className="text-gray-300 mb-6">Select the license type for &quot;{showPurchaseModal.photo.title}&quot;</p>
              
              <div className="space-y-3">
                {[
                  { type: 'personal', label: 'Personal Use', description: 'For personal use only' },
                  { type: 'commercial', label: 'Commercial License', description: 'For business and marketing use' },
                  { type: 'editorial', label: 'Editorial License', description: 'For news and editorial use' }
                ].map((license) => (
                  <button
                    key={license.type}
                    onClick={() => handlePurchaseRequest(showPurchaseModal.photo, license.type)}
                    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="font-semibold text-white">{license.label}</div>
                    <div className="text-sm text-gray-400">{license.description}</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowPurchaseModal(null)}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}