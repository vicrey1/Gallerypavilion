'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Camera, 
  Star, 
  Mail, 
  Phone, 
  Globe, 
  Instagram, 
  Twitter, 
  Facebook,
  Heart,
  Share2,
  Download,
  Eye
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
}

interface Photographer {
  id: string
  name: string
  email: string
  bio?: string
  profileImage?: string
  coverImage?: string
  location?: string
  website?: string
  phone?: string
  instagram?: string
  twitter?: string
  facebook?: string
  joinedAt: string
  totalPhotos: number
  totalViews: number
  totalDownloads: number
  averageRating: number
  totalReviews: number
  specialties: string[]
  equipment: string[]
  photos: Photo[]
}

interface Review {
  id: string
  rating: number
  comment: string
  reviewerName: string
  createdAt: string
}

export default function PhotographerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'portfolio' | 'about' | 'reviews'>('portfolio')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-low' | 'price-high'>('newest')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPhotographerData()
    }
  }, [params.id])

  const fetchPhotographerData = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockPhotographer: Photographer = {
        id: params.id as string,
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Professional photographer with over 10 years of experience specializing in landscape, portrait, and wedding photography. Passionate about capturing life\'s most beautiful moments.',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        coverImage: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=400&fit=crop',
        location: 'New York, NY',
        website: 'https://johndoe.photography',
        phone: '+1 (289) 532-4337',
        instagram: '@johndoephoto',
        twitter: '@johndoephoto',
        facebook: 'johndoephotography',
        joinedAt: '2020-01-15',
        totalPhotos: 156,
        totalViews: 45230,
        totalDownloads: 1250,
        averageRating: 4.8,
        totalReviews: 42,
        specialties: ['Landscape', 'Portrait', 'Wedding', 'Nature'],
        equipment: ['Canon EOS R5', 'Sony A7R IV', 'DJI Mavic Pro'],
        photos: [
          {
            id: '1',
            title: 'Mountain Sunrise',
            description: 'Beautiful sunrise over the mountains',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            price: 25,
            category: 'landscape',
            tags: ['mountain', 'sunrise', 'nature'],
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
            location: 'Rocky Mountains',
            isForSale: true,
            orientation: 'landscape',
            views: 1250,
            downloads: 45,
            likes: 89
          },
          // Add more mock photos...
        ]
      }

      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: 'Amazing photographer! The quality of work is outstanding.',
          reviewerName: 'Sarah Johnson',
          createdAt: '2024-01-10'
        },
        {
          id: '2',
          rating: 4,
          comment: 'Great experience working with John. Professional and creative.',
          reviewerName: 'Mike Wilson',
          createdAt: '2024-01-05'
        }
      ]

      setPhotographer(mockPhotographer)
      setReviews(mockReviews)
    } catch (err) {
      setError('Failed to load photographer profile')
      console.error('Error fetching photographer:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    try {
      // API call to follow/unfollow photographer
      setIsFollowing(!isFollowing)
    } catch (err) {
      console.error('Error following photographer:', err)
    }
  }

  const handleContactPhotographer = () => {
    if (photographer?.email) {
      const recipient = photographer?.email
      if (!recipient) {
        alert('Photographer contact email is not available')
        return
      }
      window.location.href = `mailto:${recipient}?subject=Photography Inquiry`
    }
  }

  const filteredAndSortedPhotos = () => {
    if (!photographer) return []
    
    let filtered = photographer.photos.filter(photo => {
      if (selectedCategory !== 'all' && photo.category !== selectedCategory) {
        return false
      }
      return true
    })

    // Sort photos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'popular':
          return b.views - a.views
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        default:
          return 0
      }
    })

    return filtered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading photographer profile...</div>
      </div>
    )
  }

  if (error || !photographer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">{error || 'Photographer not found'}</div>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <Image
          src={photographer.coverImage || '/api/placeholder/1200/400'}
          alt={`${photographer.name} cover`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex space-x-2">
            <button className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/70 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Image */}
              <div className="relative">
                <Image
                  src={photographer.profileImage || '/api/placeholder/150/150'}
                  alt={photographer.name}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white/20"
                />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{photographer.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                  {photographer.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{photographer.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {new Date(photographer.joinedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">{photographer.averageRating} ({photographer.totalReviews} reviews)</span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{photographer.totalPhotos}</div>
                    <div className="text-sm text-gray-400">Photos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{photographer.totalViews.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{photographer.totalDownloads}</div>
                    <div className="text-sm text-gray-400">Downloads</div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 w-full sm:w-auto">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                
                <button
                  onClick={handleContactPhotographer}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-8">
            {(['portfolio', 'about', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'portfolio' && (
            <div>
              {/* Portfolio Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
                <div className="flex flex-wrap gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="wedding">Wedding</option>
                    <option value="nature">Nature</option>
                    <option value="wildlife">Wildlife Photography</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-400">
                  {filteredAndSortedPhotos().length} photos
                </div>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedPhotos().map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <Link href={`/gallery/${params.id}/photo/${photo.id}`}>
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={photo.thumbnailUrl}
                          alt={photo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                        
                        {/* Stats */}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{photo.views}</span>
                          </div>
                          <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{photo.likes}</span>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-black/50 backdrop-blur-sm text-white text-sm px-2 py-1 rounded">
                            ${photo.price}
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <h3 className="text-white font-medium mb-1 truncate">{photo.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{photo.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {photo.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bio */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">About</h3>
                <p className="text-gray-300 leading-relaxed mb-6">{photographer.bio}</p>
                
                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {photographer.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Equipment */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Equipment</h4>
                  <div className="space-y-2">
                    {photographer.equipment.map((item) => (
                      <div key={item} className="flex items-center space-x-2 text-gray-300">
                        <Camera className="w-4 h-4" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  {photographer.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-purple-400" />
                      <a
                        href={`mailto:${photographer.email}`}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {photographer.email}
                      </a>
                    </div>
                  )}
                  
                  {photographer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-purple-400" />
                      <a
                        href={`tel:${photographer.phone}`}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {photographer.phone}
                      </a>
                    </div>
                  )}
                  
                  {photographer.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-purple-400" />
                      <a
                        href={photographer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {photographer.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3">Follow</h4>
                  <div className="flex space-x-4">
                    {photographer.instagram && (
                      <a
                        href={`https://instagram.com/${photographer.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-400 transition-colors"
                      >
                        <Instagram className="w-6 h-6" />
                      </a>
                    )}
                    
                    {photographer.twitter && (
                      <a
                        href={`https://twitter.com/${photographer.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Twitter className="w-6 h-6" />
                      </a>
                    )}
                    
                    {photographer.facebook && (
                      <a
                        href={`https://facebook.com/${photographer.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Facebook className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Reviews Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Reviews</h3>
                  <p className="text-gray-400">{photographer.totalReviews} reviews • {photographer.averageRating} average rating</p>
                </div>
              </div>
              
              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-medium">{review.reviewerName}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}