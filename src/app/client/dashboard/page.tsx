'use client'

import { motion } from 'framer-motion'
import { Camera, ArrowLeft, Heart, Download, Eye, Calendar, User, Mail, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

interface Photo {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl: string
  createdAt: string
  price?: number
  isForSale: boolean
  tags: string[]
  isFavorited?: boolean
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
  photos: Photo[]
  createdAt: string
  totalPhotos: number
  views: number
  favorites: number
}

interface ClientGallery {
  gallery: Gallery
  inviteCode: string
  permissions: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
  accessedAt: string
}

export default function ClientDashboard() {
  const [galleries, setGalleries] = useState<ClientGallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [clientEmail, setClientEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setClientEmail(email)
      fetchClientGalleries(email)
    } else {
      setError('No email provided')
      setLoading(false)
    }
  }, [searchParams])

  const fetchClientGalleries = async (email: string) => {
    try {
      const response = await fetch(`/api/client/galleries?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch galleries')
      }

      setGalleries(data.galleries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load galleries')
    } finally {
      setLoading(false)
    }
  }

  const handleGalleryAccess = (gallery: ClientGallery) => {
    // Store gallery data in sessionStorage for the gallery page
    sessionStorage.setItem('inviteGalleryData', JSON.stringify({
      gallery: gallery.gallery,
      permissions: gallery.permissions,
      invite: { code: gallery.inviteCode }
    }))
    
    // Navigate to the gallery with invite code
    router.push(`/invite/${gallery.inviteCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your galleries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link 
            href="/invite"
            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invite Page</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">Gallery Pavilion</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <User className="h-4 w-4" />
              <span className="text-sm">{clientEmail}</span>
            </div>
            <Link 
              href="/invite"
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Private Galleries
            </h1>
            <p className="text-xl text-gray-300">
              Access your exclusive photography collections
            </p>
          </motion.div>

          {galleries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">No Galleries Found</h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                You don't have access to any galleries yet. Check your email for invitations from photographers.
              </p>
              <Link 
                href="/invite"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Mail className="h-4 w-4" />
                <span>Enter Invite Code</span>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* View Mode Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-between items-center mb-8"
              >
                <div className="text-white">
                  <h2 className="text-2xl font-semibold mb-2">Your Galleries</h2>
                  <p className="text-gray-300">{galleries.length} gallery{galleries.length !== 1 ? 's' : ''} available</p>
                </div>
                
                <div className="flex bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white/20 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white/20 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>

              {/* Galleries Grid/List */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
                }
              >
                {galleries.map((clientGallery, index) => {
                  const { gallery, permissions } = clientGallery
                  const coverPhoto = gallery.photos[0]
                  
                  return (
                    <motion.div
                      key={gallery.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                      className={`bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                      onClick={() => handleGalleryAccess(clientGallery)}
                    >
                      {/* Cover Image */}
                      <div className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-48 h-32' : 'aspect-video'
                      }`}>
                        {coverPhoto ? (
                          <Image
                            src={coverPhoto.thumbnailUrl}
                            alt={gallery.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/50 to-pink-600/50 flex items-center justify-center">
                            <Camera className="h-12 w-12 text-white/60" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </div>

                      {/* Content */}
                      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {gallery.title}
                        </h3>
                        
                        {gallery.description && (
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {gallery.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                          <span>By {gallery.photographer.name || gallery.photographer.businessName}</span>
                          <span>{gallery.totalPhotos} photos</span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{gallery.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{gallery.favorites}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(gallery.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Permissions */}
                        <div className="flex flex-wrap gap-2">
                          {permissions.canDownload && (
                            <span className="inline-flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </span>
                          )}
                          {permissions.canFavorite && (
                            <span className="inline-flex items-center space-x-1 bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full text-xs">
                              <Heart className="h-3 w-3" />
                              <span>Favorite</span>
                            </span>
                          )}
                          {permissions.canRequestPurchase && (
                            <span className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                              <span>Purchase</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}
