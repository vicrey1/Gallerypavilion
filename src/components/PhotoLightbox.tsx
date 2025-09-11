'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Heart, Info, Camera, MapPin, Calendar, Eye } from 'lucide-react'
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
  favorites: number
  downloads: number
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  orientation?: 'landscape' | 'portrait' | 'square'
  isFavorited?: boolean
  photographer?: {
    id: string
    name: string
    email: string
  }
}

interface PhotoLightboxProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onFavorite?: (photoId: string) => void
  onDownload?: (photoId: string) => void
}

export default function PhotoLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onFavorite,
  onDownload
}: PhotoLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [showInfo, setShowInfo] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const currentPhoto = photos[currentIndex]

  // Reset zoom and pan when photo changes
  useEffect(() => {
    setZoom(1)
    setPanPosition({ x: 0, y: 0 })
    setImageLoaded(false)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrevious()
          break
        case 'ArrowRight':
          onNext()
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.5, 5))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.5, 0.5))
          break
        case 'i':
        case 'I':
          setShowInfo(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5))
  const handleResetZoom = () => {
    setZoom(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
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

  if (!isOpen || !currentPhoto) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">{currentPhoto.title}</h3>
              <span className="text-sm text-gray-300">
                {currentIndex + 1} of {photos.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              
              <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
                title="Reset Zoom"
              >
                1:1
              </button>
              
              {/* Action Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className={`p-2 rounded-lg transition-colors ${
                  showInfo ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Toggle Info (I)"
              >
                <Info className="h-5 w-5" />
              </button>
              
              {onFavorite && (
                <button
                  onClick={(e) => { e.stopPropagation(); onFavorite(currentPhoto.id); }}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPhoto.isFavorited 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={currentPhoto.isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`h-5 w-5 ${
                    currentPhoto.isFavorited ? 'fill-current' : ''
                  }`} />
                </button>
              )}
              
              {onDownload && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(currentPhoto.id); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Previous (←)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Next (→)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Main Image */}
        <div 
          className="flex items-center justify-center h-full p-16"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <motion.div
            className="relative max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.title}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setImageLoaded(true)}
              priority
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-sm border-l border-white/10 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* Photo Title & Description */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{currentPhoto.title}</h2>
                  {currentPhoto.description && (
                    <p className="text-gray-300 text-sm leading-relaxed">{currentPhoto.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-gray-400">Favorites</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{currentPhoto.favorites}</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Download className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Downloads</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{currentPhoto.downloads}</div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Details</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Uploaded {formatDate(currentPhoto.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Camera className="h-4 w-4 text-gray-400" />
                      <span>{formatFileSize(currentPhoto.fileSize)} • {currentPhoto.mimeType}</span>
                    </div>
                    
                    {currentPhoto.location && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{currentPhoto.location}</span>
                      </div>
                    )}
                    
                    {currentPhoto.orientation && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="capitalize">{currentPhoto.orientation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {currentPhoto.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPhoto.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full text-xs border border-purple-500/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {currentPhoto.isForSale && currentPhoto.price && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Pricing</h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Price</span>
                      <span className="text-white font-semibold">${currentPhoto.price}</span>
                    </div>
                  </div>
                )}

                {/* Photographer */}
                {currentPhoto.photographer && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Photographer</h3>
                    <div className="text-sm text-gray-300">
                      <div className="font-medium text-white">{currentPhoto.photographer.name}</div>
                      <div className="text-gray-400">{currentPhoto.photographer?.email ?? 'Contact not available'}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}