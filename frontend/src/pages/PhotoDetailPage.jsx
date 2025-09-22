import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Camera, Calendar, MapPin, Info, Mail, ShoppingCart, Sun, Moon, Heart, Share2, Download, Eye, Palette, Award, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PhotoEditForm from '../components/PhotoEditForm';

const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const PhotoDetailPage = () => {
  const { token, photoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  // Theme: default to system
  const [theme, setTheme] = useState(prefersDark() ? 'dark' : 'light');
  
  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Check if current user is the photographer
  const isPhotographer = isAuthenticated && user && photo?.photographer && 
    (user.id === photo.photographer._id || user.id === photo.photographer);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // We can fetch photo by id; the backend allows optional auth and public access if permitted
        const params = {};
        // If there was a password or invite on gallery, propagate via query if present
        const password = searchParams.get('password');
        const invite = searchParams.get('invite');
        if (password) params.password = password;
        if (invite) params.invite = invite;

        // Fetch the shared gallery to get photographer contact and photos
        const galleryResp = await axios.get(`/share/${token}`, { params });
        const g = galleryResp.data.gallery || galleryResp.data;
        const respPhotographer = galleryResp.data.photographer || g?.photographer;
        const photos = galleryResp.data.photos || [];
        
        const normalizedPhotographer = respPhotographer && typeof respPhotographer === 'object'
          ? {
              ...respPhotographer,
              name: respPhotographer.name || `${respPhotographer.firstName || ''} ${respPhotographer.lastName || ''}`.trim(),
              email: respPhotographer.email || respPhotographer.clientEmail || undefined,
            }
          : respPhotographer || undefined;
        const normalizedGallery = {
          ...g,
          photographer: normalizedPhotographer || (typeof g?.photographer === 'object'
            ? {
                ...g.photographer,
                name: g.photographer.name || `${g.photographer.firstName || ''} ${g.photographer.lastName || ''}`.trim(),
              }
            : g?.photographer),
        };
        setGallery(normalizedGallery);

        // Find the specific photo from the shared gallery photos
        const specificPhoto = photos.find(p => p._id === photoId);
        if (!specificPhoto) {
          throw new Error('Photo not found in this gallery');
        }
        setPhoto(specificPhoto);

        // Check if current user is the photographer is now handled by computed value below
      } catch (err) {
        console.error('Failed to load photo detail', err);
        setError(err.response?.data?.message || 'Failed to load photo details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, photoId, searchParams]);

  const handleSavePhoto = async (updatedData) => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await axios.put(
        `/api/photos/${photoId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the local photo state
      setPhoto(response.data);
      setIsEditing(false);
      
      // Show success message (you can add a toast notification here)
      console.log('Photo updated successfully');
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  };

  const photographerEmail = useMemo(() => {
    const fromGallery = gallery?.photographer?.email || gallery?.photographer?.clientEmail;
    const fromPhoto = photo?.photographer?.email || photo?.photographer?.clientEmail;
    const fromPhotoGallery = photo?.gallery?.photographer?.email || photo?.gallery?.photographer?.clientEmail;
    return fromGallery || fromPhoto || fromPhotoGallery || '';
  }, [gallery, photo]);

  const handleInquiry = () => {
    if (!photo) return;
    if (!photographerEmail) {
      alert('Photographer email not available yet. Please try again later or contact the gallery owner.');
      return;
    }
    const subject = `Inquiry about \"${photo.title || 'Artwork'}\"`;
    const body = `Hi,\n\nI'm interested in learning more about the artwork \"${photo.title || 'this piece'}\"${photo.metadata?.artworkInfo ? ` (${photo.metadata.artworkInfo.medium}${photo.metadata.artworkInfo.year ? `, ${photo.metadata.artworkInfo.year}` : ''})` : ''}.\n\n${photo.metadata?.purchaseInfo?.price ? `Listed price: $${photo.metadata.purchaseInfo.price.toLocaleString()}\n\n` : ''}Please provide more information about availability, pricing, and shipping.\n\nThank you!`;
    const mailtoLink = `mailto:${encodeURIComponent(photographerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handlePurchase = () => {
    if (!photo) return;
    if (!photographerEmail) {
      alert('Photographer email not available yet. Please try again later or contact the gallery owner.');
      return;
    }
    const subject = `Purchase request for \"${photo.title || 'Artwork'}\"`;
    const body = `Hello,\n\nI would like to purchase \"${photo.title || 'this artwork'}\".${photo.metadata?.purchaseInfo?.price ? `\n\nPrice understood: $${photo.metadata.purchaseInfo.price.toLocaleString()}` : ''}\n\nPlease let me know the next steps for payment and delivery.\n\nBest regards,`;
    const mailtoLink = `mailto:${encodeURIComponent(photographerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-black text-neutral-800 dark:text-neutral-100">
        <div className="animate-spin h-10 w-10 border-4 border-neutral-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-100 dark:bg-black text-neutral-800 dark:text-neutral-100">
        <p className="text-lg">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black">Go Back</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-black dark:via-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 relative overflow-hidden`}>
      {/* Removed animated background elements for performance and clarity */}
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8 gap-3 flex-wrap sm:flex-nowrap"
        >
          <button 
            onClick={() => navigate(`/gallery/${token}`)} 
            className="group inline-flex items-center gap-3 text-sm px-5 py-3 rounded-2xl bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back to Gallery</span>
          </button>
          
          <div className="flex items-center gap-3">
            {isPhotographer && (
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 text-sm px-5 py-3 rounded-2xl bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Edit3 size={16} />
                <span className="font-medium">Edit</span>
              </button>
            )}
            <button className="p-3 rounded-2xl bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Share2 size={18} />
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="inline-flex items-center gap-2 text-sm px-5 py-3 rounded-2xl bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className="group"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-black">
              {/* Image container with hover effects */}
              <div className="relative overflow-hidden">
                <motion.img 
                  src={photo.url || photo.previewUrl || photo.thumbnailUrl} 
                  alt={photo.title || 'Photo'} 
                  className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-500 group-hover:scale-103 mx-auto"
                />
                
                {/* Overlay with actions */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="flex gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors"
                      >
                        <Eye size={20} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors"
                      >
                        <Heart size={20} />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors"
                    >
                      <Download size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
              
              {/* Premium badge if price exists */}
              {photo.metadata?.purchaseInfo?.price && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-6 right-6 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center gap-2"
                >
                  <Award size={16} />
                  Premium
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} 
        className="space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.h1 
            className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {photo.title || 'Untitled'}
          </motion.h1>
          {photo.metadata?.description && (
            <motion.p 
              className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {photo.metadata.description}
            </motion.p>
          )}
        </motion.div>

        {/* Artsy-style Tabbed Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          {/* Tab Navigation */}
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('about')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'about' 
                    ? 'border-black dark:border-white text-neutral-900 dark:text-neutral-100' 
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                About the work
              </button>

              <button 
                onClick={() => setActiveTab('provenance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'provenance' 
                    ? 'border-black dark:border-white text-neutral-900 dark:text-neutral-100' 
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Provenance
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Description */}
                {photo.metadata?.description && (
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {photo.metadata.description}
                    </p>
                  </div>
                )}

                {/* Detailed Artwork Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {photo.artwork?.materials && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Materials</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.materials}</dd>
                      </div>
                    )}
                    {photo.artwork?.dimensions && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Size</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.dimensions}</dd>
                      </div>
                    )}
                    {photo.artwork?.edition && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Edition</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.edition}</dd>
                      </div>
                    )}
                    {photo.artwork?.rarity && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rarity</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.rarity}</dd>
                      </div>
                    )}
                    {photo.artwork?.medium && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Medium</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.medium}</dd>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {photo.artwork?.condition && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Condition</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.condition}</dd>
                      </div>
                    )}
                    {photo.artwork?.signature && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Signature</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.signature}</dd>
                      </div>
                    )}
                    {photo.artwork?.certificate !== undefined && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Certificate of authenticity</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.certificate ? 'Included' : 'Not included'}</dd>
                      </div>
                    )}
                    {photo.artwork?.frame && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Frame</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.frame}</dd>
                      </div>
                    )}
                    {photo.artwork?.series && (
                      <div>
                        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Series</dt>
                        <dd className="text-neutral-900 dark:text-neutral-100">{photo.artwork.series}</dd>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}



            {activeTab === 'provenance' && (
              <motion.div 
                key="provenance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {photo.artwork?.provenance ? (
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Provenance</h4>
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {photo.artwork.provenance}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-neutral-500 dark:text-neutral-400">No provenance information available</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Technical Details */}
        {photo.metadata?.exif && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl"
          >
            <div className="space-y-4">
              <div className="font-semibold text-lg flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Camera size={18} />
                </div>
                Technical Details
              </div>
              
              {photo.metadata?.exif && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-3"
                >
                  <div className="font-semibold text-lg flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <Camera size={18} />
                    </div>
                    Technical Details
                  </div>
                  <div className="grid gap-2 pl-12">
                    {photo.metadata.exif.cameraModel && (
                      <div className="flex justify-between items-center py-2 border-b border-neutral-200/50 dark:border-neutral-700/50">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium">Camera</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{photo.metadata.exif.cameraModel}</span>
                      </div>
                    )}
                    {photo.metadata.exif.lensModel && (
                      <div className="flex justify-between items-center py-2 border-b border-neutral-200/50 dark:border-neutral-700/50">
                        <span className="text-neutral-600 dark:text-neutral-400 font-medium">Lens</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{photo.metadata.exif.lensModel}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {photo.metadata.exif.fNumber && (
                        <div className="text-center p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Aperture</div>
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">f/{photo.metadata.exif.fNumber}</div>
                        </div>
                      )}
                      {photo.metadata.exif.exposureTime && (
                        <div className="text-center p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Shutter</div>
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{photo.metadata.exif.exposureTime}s</div>
                        </div>
                      )}
                      {photo.metadata.exif.iso && (
                        <div className="text-center p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">ISO</div>
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{photo.metadata.exif.iso}</div>
                        </div>
                      )}
                      {photo.metadata.exif.focalLength && (
                        <div className="text-center p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Focal</div>
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{photo.metadata.exif.focalLength}mm</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {photo.metadata?.location && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                  className="space-y-3"
                >
                  <div className="font-semibold text-lg flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white">
                      <MapPin size={18} />
                    </div>
                    Location
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 pl-12 font-medium">{photo.metadata.location}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Price and actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-6"
        >
          {photo.artwork?.price && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/50"
            >
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide mb-2">
                {photo.artwork.isForSale ? 'Price' : 'Estimated Value'}
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {photo.artwork.currency || '$'}{parseFloat(photo.artwork.price).toLocaleString()}
              </div>
              {photo.artwork.isForSale && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                  Available for Purchase
                </div>
              )}
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <motion.button 
              onClick={handleInquiry}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 text-white dark:text-black font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                <Mail size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                <span>Inquiry</span>
              </div>
            </motion.button>
            
            <motion.button 
              onClick={handlePurchase}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                <ShoppingCart size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span>Purchase</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Artist Information - Artsy Style */}
        {gallery?.photographer?.name && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="space-y-6"
          >
            {/* Artist Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center text-2xl font-bold text-neutral-600 dark:text-neutral-300">
                {gallery.photographer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{gallery.photographer.name}</h3>
              </div>
            </div>

            {/* Artist Biography */}
            {photo.artist?.biography && (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {photo.artist.biography}
                </p>
              </div>
            )}








            {/* Contact */}
            {gallery.photographer.email && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Contact</div>
                <div className="text-neutral-600 dark:text-neutral-400">{gallery.photographer.email}</div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <PhotoEditForm
                photo={photo}
                onSave={handleSavePhoto}
                onCancel={() => setIsEditing(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoDetailPage;