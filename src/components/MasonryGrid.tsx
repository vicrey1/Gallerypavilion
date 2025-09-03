'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Heart, Eye, Download, Star, DollarSign, Edit, Trash2 } from 'lucide-react'

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
  basePrice?: number
  commercialPrice?: number
  extendedPrice?: number
  isForSale: boolean
  isFavorited?: boolean
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

interface MasonryGridProps {
  photos: Photo[]
  onPhotoClick: (photo: Photo) => void
  onEditPhoto?: (photo: Photo) => void
  onDeletePhoto?: (photoId: string) => void
  onFavorite?: (photoId: string) => void
  selectedPhotos?: Set<string>
  onPhotoSelect?: (photoId: string, selected: boolean) => void
  showActions?: boolean
  columns?: number
}

export default function MasonryGrid({
  photos,
  onPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  onFavorite,
  selectedPhotos = new Set(),
  onPhotoSelect,
  showActions = false,
  columns = 4
}: MasonryGridProps) {
  const [columnHeights, setColumnHeights] = useState<number[]>(new Array(columns).fill(0))
  const [photoColumns, setPhotoColumns] = useState<Photo[][]>(new Array(columns).fill(null).map(() => []))
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Calculate responsive columns
  const getResponsiveColumns = () => {
    if (containerWidth < 640) return 2
    if (containerWidth < 1024) return 3
    if (containerWidth < 1280) return 4
    return 5
  }

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Distribute photos across columns
  useEffect(() => {
    const responsiveColumns = getResponsiveColumns()
    const newPhotoColumns: Photo[][] = new Array(responsiveColumns).fill(null).map(() => [])
    const newColumnHeights = new Array(responsiveColumns).fill(0)

    photos.forEach((photo) => {
      // Find the shortest column
      const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights))
      
      // Add photo to shortest column
      newPhotoColumns[shortestColumnIndex].push(photo)
      
      // Estimate height based on aspect ratio (assuming square base + content)
      const estimatedHeight = photo.orientation === 'portrait' ? 350 : 
                             photo.orientation === 'landscape' ? 250 : 300
      newColumnHeights[shortestColumnIndex] += estimatedHeight
    })

    setPhotoColumns(newPhotoColumns)
    setColumnHeights(newColumnHeights)
  }, [photos, containerWidth])

  const handlePhotoClick = (photo: Photo, e: React.MouseEvent) => {
    e.preventDefault()
    onPhotoClick(photo)
  }

  const handleEditClick = (photo: Photo, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEditPhoto?.(photo)
  }

  const handleDeleteClick = (photoId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeletePhoto?.(photoId)
  }

  const handleSelectChange = (photoId: string, selected: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPhotoSelect?.(photoId, selected)
  }

  const handleFavoriteClick = (photoId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(photoId)
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex gap-4">
        {photoColumns.map((columnPhotos, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-4">
            {columnPhotos.map((photo, photoIndex) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: photoIndex * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-purple-500/20"
                onClick={(e) => handlePhotoClick(photo, e)}
              >
                {/* Photo Container */}
                <div className="relative">
                  <div className={`relative ${
                    photo.orientation === 'portrait' ? 'aspect-[3/4]' :
                    photo.orientation === 'landscape' ? 'aspect-[4/3]' :
                    'aspect-square'
                  }`}>
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Selection Checkbox */}
                    {onPhotoSelect && (
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <input
                          type="checkbox"
                          checked={selectedPhotos.has(photo.id)}
                          onChange={(e) => handleSelectChange(photo.id, e.target.checked, e as any)}
                          className="w-5 h-5 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {onFavorite && (
                        <button
                          onClick={(e) => handleFavoriteClick(photo.id, e)}
                          className={`p-2 rounded-full transition-colors backdrop-blur-sm ${
                            photo.isFavorited 
                              ? 'bg-red-500/30 hover:bg-red-500/40 text-red-300' 
                              : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${
                            photo.isFavorited ? 'fill-current' : ''
                          }`} />
                        </button>
                      )}
                      {showActions && onEditPhoto && (
                        <button
                          onClick={(e) => handleEditClick(photo, e)}
                          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {showActions && onDeletePhoto && (
                        <button
                          onClick={(e) => handleDeleteClick(photo.id, e)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {photo.downloads > 10 && (
                        <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>Popular</span>
                        </div>
                      )}
                      {photo.isForSale && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>For Sale</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Stats */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex space-x-3 text-white text-xs">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full backdrop-blur-sm ${
                          photo.isFavorited ? 'bg-red-500/30 text-red-300' : 'bg-black/30'
                        }`}>
                          <Heart className={`h-3 w-3 ${
                            photo.isFavorited ? 'fill-current' : ''
                          }`} />
                          <span>{photo.favorites}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                          <Download className="h-3 w-3" />
                          <span>{photo.downloads}</span>
                        </div>
                      </div>
                      
                      {photo.basePrice && (
                        <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ${photo.basePrice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Photo Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {photo.title}
                  </h3>
                  
                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {photo.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs hover:bg-purple-500/30 transition-colors">
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-gray-400 text-xs">+{photo.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                    {photo.location && (
                      <span className="truncate ml-2">{photo.location}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}