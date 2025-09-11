'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, Eye, Heart, ShoppingCart, MessageCircle, AlertCircle, CheckCircle, Clock, X, Grid, List, Search, Filter, SortAsc, Share2, FileImage, Grid3X3, SlidersHorizontal, Award, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PhotoLightbox from '@/components/PhotoLightbox';

interface Photo {
  id: string;
  filename: string;
  url?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  price?: number;
  basePrice?: number;
  isForSale: boolean;
  isPrivate: boolean;
  createdAt: string;
  fileSize?: number;
  mimeType?: string;
  favorites?: number;
  views?: number;
  location?: string;
  isFavorited?: boolean;
  status?: string;
}

interface Gallery {
  id: string;
  title: string;
  description?: string;
  photographer: {
    id: string;
    name: string;
    businessName?: string;
    user: {
      email: string;
    };
  };
  photos: Photo[];
  createdAt: string;
  totalPhotos?: number;
  views?: number;
  favorites?: number;
  isPublic?: boolean;

  requirePassword?: boolean;
  expiresAt?: string;
  status?: string;
}

interface Permissions {
  canView: boolean;
  canFavorite: boolean;
  canComment: boolean;

  canRequestPurchase: boolean;
}

interface InviteData {
  id: string;
  type: string;
  expiresAt?: string;
  usageCount: number;
  maxUsage?: number;
}

interface GalleryData {
  gallery: Gallery;
  permissions: Permissions;
  invite: InviteData;
}

export default function InviteGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'masonry' | 'grid' | 'list'>('masonry');
  const [showFilters, setShowFilters] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getAllCategories = () => {
    const categories = new Set<string>();
    categories.add('all');
    galleryData?.gallery.photos.forEach(photo => {
      if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach(tag => categories.add(tag));
      }
    });
    return Array.from(categories);
  };

  useEffect(() => {
    const validateInvite = async () => {
      console.log('Validating invite code:', params.inviteCode)
      try {
        const response = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inviteCode: params.inviteCode,
          }),
        });

        if (!response.ok) {
          throw new Error('Invalid or expired invite');
        }

        const data = await response.json();
        console.log('Invite validation response:', data);
        if (data.error) {
          throw new Error(data.error);
        }
        setGalleryData(data);
      } catch (err) {
        console.error('Invite validation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    if (params.inviteCode) {
      validateInvite();
    }
  }, [params.inviteCode]);

  const toggleFavorite = (photoId: string) => {
    if (!galleryData?.permissions.canFavorite) return;

    const wasFavorited = favorites.has(photoId);

    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (wasFavorited) {
        newFavorites.delete(photoId);
      } else {
        newFavorites.add(photoId);
      }
      
      // Update local storage
      try {
        localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
      
      return newFavorites;
    });

    if (galleryData) {
      setGalleryData({
        ...galleryData,
        gallery: {
          ...galleryData.gallery,
          photos: galleryData.gallery.photos.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  favorites: (photo.favorites || 0) + (wasFavorited ? -1 : 1),
                  isFavorited: !wasFavorited
                }
              : photo
          )
        }
      });
    }
  };

  const handleBuyPhoto = (photo: Photo) => {
    if (!galleryData?.permissions.canRequestPurchase) return;
    
    const subject = `Purchase request for photo: ${photo.title}`;
    const body = `Hi ${galleryData.gallery.photographer.name},\n\nI would like to purchase the photo "${photo.title}" from your gallery "${galleryData.gallery.title}".\n\nPhoto Details:\n- Title: ${photo.title}\n- Price: $${photo.basePrice || photo.price}\n\nPlease let me know the next steps for completing this purchase.\n\nBest regards`;
    
    const recipient = galleryData?.gallery.photographer?.user?.email
    if (!recipient) {
      alert('Photographer contact email is not available')
      return
    }
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const openLightbox = (photo: Photo) => {
    const index = filteredAndSortedPhotos.findIndex(p => p.id === photo.id);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredAndSortedPhotos.length);
  };

  const previousPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredAndSortedPhotos.length) % filteredAndSortedPhotos.length);
  };

  const handleLightboxFavorite = (photoId: string) => {
    toggleFavorite(photoId);
  };



  const filteredAndSortedPhotos = galleryData?.gallery.photos ? (() => {
    let filtered = [...galleryData.gallery.photos];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(photo.tags) && photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(photo => 
        Array.isArray(photo.tags) && photo.tags.includes(selectedCategory)
      );
    }

    // Apply availability filter
    if (filterBy === 'for-sale') {
      filtered = filtered.filter(photo => photo.isForSale);
    } else if (filterBy === 'free') {
      filtered = filtered.filter(photo => !photo.isForSale);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-liked':
          return (b.favorites || 0) - (a.favorites || 0);
        case 'price-low':
          return (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0);
        case 'price-high':
          return (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  })() : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!galleryData) {
    return null;
  }

  const { permissions, invite } = galleryData;
  const gallery = galleryData.gallery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-white">
                <span className="text-sm">Gallery View</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Invited Access</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-white hover:text-purple-300 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Back</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <Link href="/invite/favorites" className="flex items-center text-white hover:text-red-300 transition-colors">
                  <Heart className="w-4 h-4 mr-1" />
                  <span className="text-sm">Favorites</span>
                </Link>
                
                {invite.expiresAt && (
                  <div className="flex items-center text-xs text-amber-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center text-white hover:text-purple-300 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Home</span>
              </Link>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Invited Access</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/invite/favorites" className="flex items-center text-white hover:text-red-300 transition-colors">
                <Heart className="w-5 h-5 mr-2" />
                <span>My Favorites</span>
              </Link>
              
              {invite.expiresAt && (
                <div className="flex items-center text-sm text-amber-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {gallery.title}
            </h1>
            {gallery.description && (
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-6">
                {gallery.description}
              </p>
            )}
            
            <div className="flex items-center justify-center text-sm text-gray-400 mb-8">
              <span>by {gallery.photographer.name || gallery.photographer.businessName}</span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{gallery.photos.length}</div>
                <div className="text-sm text-gray-400">Photos</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{gallery.views || 0}</div>
                <div className="text-sm text-gray-400">Views</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-white">{gallery.favorites || 0}</div>
                <div className="text-sm text-gray-400">Favorites</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 mb-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {getAllCategories().map(category => (
                      <option key={category} value={category} className="bg-gray-800">
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all" className="bg-gray-800">All Photos</option>
                    <option value="for-sale" className="bg-gray-800">For Sale</option>
                    <option value="free" className="bg-gray-800">Free</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="newest" className="bg-gray-800">Newest First</option>
                    <option value="oldest" className="bg-gray-800">Oldest First</option>
                    <option value="most-liked" className="bg-gray-800">Most Liked</option>
                    <option value="price-low" className="bg-gray-800">Price: Low to High</option>
                    <option value="price-high" className="bg-gray-800">Price: High to Low</option>
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">View Mode</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('masonry')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'masonry' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Gallery Grid */}
          {filteredAndSortedPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No photos found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className={
              viewMode === 'masonry' ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4' :
              viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' :
              'space-y-4'
            }>
              {filteredAndSortedPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 ${
                    viewMode === 'masonry' ? 'break-inside-avoid mb-4' :
                    viewMode === 'list' ? 'flex items-center p-4' : ''
                  }`}
                >
                  <Link href={`/invite/${params.inviteCode}/photo/${photo.id}`} className="block">
                  <div className="relative cursor-pointer">
                    <Image
                      src={photo.thumbnailUrl || photo.url || `/api/images/thumbnails/${photo.filename}`}
                      alt={photo.title || 'Photo'}
                      width={400}
                      height={viewMode === 'masonry' ? 600 : 400}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {galleryData?.permissions.canFavorite && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            favorites.has(photo.id) || photo.isFavorited
                              ? 'bg-red-500 text-white'
                              : 'bg-black/50 text-white hover:bg-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${
                            favorites.has(photo.id) || photo.isFavorited ? 'fill-current' : ''
                          }`} />
                        </button>
                      )}
                      
                      {galleryData?.permissions.canRequestPurchase && photo.isForSale && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBuyPhoto(photo); }}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {galleryData?.permissions.canFavorite && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                              className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                                favorites.has(photo.id) || photo.isFavorited
                                  ? 'bg-red-500/80 text-white'
                                  : 'bg-black/50 text-white hover:bg-red-500/80'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${
                                favorites.has(photo.id) || photo.isFavorited ? 'fill-current' : ''
                              }`} />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const recipient = galleryData?.gallery.photographer?.user?.email;
                              console.log('Certificate mailto recipient:', recipient)
                              if (!recipient) {
                                alert('Photographer contact email is not available')
                                return
                              }
                              window.open(`mailto:${recipient}?subject=Certificate Request: ${photo.title || photo.filename}&body=Hello, I would like to request the certificate of authenticity for this artwork.`, '_blank');
                            }}
                            className="p-2 rounded-lg bg-amber-500/80 text-white hover:bg-amber-600/80 transition-colors backdrop-blur-sm"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          
                          {galleryData?.permissions.canRequestPurchase && photo.isForSale && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBuyPhoto(photo); }}
                              className="p-2 rounded-lg bg-green-500/80 text-white hover:bg-green-600/80 transition-colors backdrop-blur-sm"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {photo.isForSale && (
                          <span className="text-green-400 font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                            ${photo.basePrice || photo.price}
                          </span>
                        )}
                      </div>
                      
                      {(photo.favorites || 0) > 10 && (
                        <div className="mt-2 flex items-center text-sm text-gray-300">
                          <Heart className="w-3 h-3 mr-1 text-red-400" />
                          <span>{photo.favorites} favorites</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  </Link>
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">{photo.title || 'Untitled'}</h3>
                    
                    {photo.tags && Array.isArray(photo.tags) && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Array.isArray(photo.tags) ? photo.tags.slice(0, 3).map((tag, tagIndex) => (
                           <span key={tagIndex} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full hover:bg-white/20 transition-colors">
                             {tag}
                           </span>
                         )) : null}
                        {Array.isArray(photo.tags) && photo.tags.length > 3 && (
                          <span className="text-xs text-gray-400 px-2 py-1">
                            +{photo.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3 text-gray-400">
                        <span className="flex items-center hover:text-purple-400 transition-colors">
                          <Heart className="w-3 h-3 mr-1" />
                          {photo.favorites || 0}
                        </span>
                        <span className="flex items-center hover:text-blue-400 transition-colors">
                          <Palette className="w-3 h-3 mr-1" />
                          Original Art
                        </span>
                        <span className="flex items-center hover:text-green-400 transition-colors">
                          <Eye className="w-3 h-3 mr-1" />
                          {photo.views || 0}
                        </span>
                      </div>
                      
                      {photo.isForSale && (photo.basePrice || photo.price) && (
                        <span className="text-green-400 font-medium">
                          ${photo.basePrice || photo.price}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* PhotoLightbox */}
        {lightboxOpen && (
          <PhotoLightbox
            isOpen={lightboxOpen}
            photos={filteredAndSortedPhotos.map(photo => ({
              id: photo.id,
              title: photo.title || 'Untitled',
              description: photo.description,
              url: `/api/images/${photo.filename}`,
              thumbnailUrl: `/api/images/thumbnails/${photo.filename}`,
              createdAt: photo.createdAt,
              fileSize: photo.fileSize || 0,
              mimeType: photo.mimeType || 'image/jpeg',
              favorites: photo.favorites || 0,
              downloads: 0,
              price: photo.basePrice || photo.price,
              isForSale: photo.isForSale,
              tags: Array.isArray(photo.tags) ? photo.tags : [],
              category: Array.isArray(photo.tags) ? photo.tags[0] : undefined,
              location: photo.location,
              photographer: {
                id: gallery.photographer.id,
                name: gallery.photographer.name || gallery.photographer.businessName || 'Unknown',
                email: gallery.photographer.user.email
              }
            }))}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onNext={nextPhoto}
            onPrevious={previousPhoto}
            onFavorite={permissions.canFavorite ? handleLightboxFavorite : undefined}

          />
        )}
      </div>
    </div>
  );
}