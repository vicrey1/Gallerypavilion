import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Download, 
  Heart, 
  Share2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Camera,
  Calendar,
  Lock,
  Unlock,
  Mail,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import './GalleryView.css';

const GalleryView = ({ galleryId: propGalleryId, isSharedView = false }) => {
  const { galleryId: paramGalleryId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const password = searchParams.get('password');
  
  // Use prop galleryId if provided, otherwise use URL param
  const galleryId = propGalleryId || paramGalleryId;
  // For shared view, treat galleryId as token
  const actualToken = isSharedView ? galleryId : token;
  
  const [gallery, setGallery] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  // removed unused: shareLink, passwordRequired, invitationRequired
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredInvitation, setEnteredInvitation] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [invitationError, setInvitationError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  
  const lightboxRef = useRef(null);
  const imageRef = useRef(null);
  
  // Theme and navigation
  const navigate = useNavigate();
  const getSystemTheme = () => (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );
  const [theme, setTheme] = useState(getSystemTheme());
  const darkBg = '#0b0b0b';
  const lightBg = '#f7f7f9';
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);
  
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else if (mql.addListener) {
      mql.addListener(handler);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else if (mql.removeListener) {
        mql.removeListener(handler);
      }
    };
  }, []);
  
  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };
  
  // Verify password for protected share links
  const verifyPassword = useCallback(async (passwordToVerify) => {
    try {
      const response = await axios.post(`/share/${actualToken}/verify-password`, {
        password: passwordToVerify
      });
      return response.data.verified;
    } catch (err) {
      console.error('Password verification failed:', err);
      return false;
    }
  }, [actualToken]);

  // Fetch gallery data
  const fetchGallery = useCallback(async (verifiedPassword = null) => {
    try {
      setLoading(true);
      setError(null);

      const url = actualToken
        ? `/share/${actualToken}`
        : `/galleries/${galleryId}/public`;

      const params = {};
      if (actualToken && (verifiedPassword || password)) {
        params.password = verifiedPassword || password;
      }

      const response = await axios.get(url, { params });
      const data = response.data;

      // Normalize photographer info so UI can consistently use gallery.photographer.name and .email
      const respPhotographer = data.photographer || data.gallery?.photographer;
      const normalizedPhotographer = respPhotographer && typeof respPhotographer === 'object'
        ? {
            ...respPhotographer,
            name: respPhotographer.name || `${respPhotographer.firstName || ''} ${respPhotographer.lastName || ''}`.trim(),
            email: respPhotographer.email || respPhotographer.clientEmail || undefined,
          }
        : respPhotographer || undefined;
      const normalizedGallery = {
        ...data.gallery,
        photographer: normalizedPhotographer || (typeof data.gallery?.photographer === 'object'
          ? {
              ...data.gallery.photographer,
              name: data.gallery.photographer.name || `${data.gallery.photographer.firstName || ''} ${data.gallery.photographer.lastName || ''}`.trim(),
            }
          : data.gallery?.photographer),
      };

      setGallery(normalizedGallery);
      setPhotos(data.photos || []);
      // removed unused setShareLink
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.requiresPassword) {
        setShowPasswordModal(true);
        return;
      }
     
      if (err.response?.status === 403 && err.response?.data?.requiresInvitation) {
        setShowInvitationModal(true);
        return;
      }
      console.error('Error fetching gallery:', err);
      
      // Provide specific error messages based on status code
      let errorMessage = 'Failed to load gallery';
      if (err.response?.status === 404) {
        errorMessage = 'Gallery not found or no longer available';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to access this gallery';
      } else if (err.response?.status === 410) {
        errorMessage = 'This gallery link has expired';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again';
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [galleryId, actualToken, password]);
  
  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);
  
  // Handle password submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError(null);
    
    try {
      // First verify the password
      const isValid = await verifyPassword(enteredPassword);
      
      if (!isValid) {
        setPasswordError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
      
      // If password is valid, fetch gallery data
      setShowPasswordModal(false);
      setError(null);
      await fetchGallery(enteredPassword);
      setEnteredPassword('');
    } catch (err) {
      console.error('Password submission error:', err);
      if (err.response?.status === 401) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (err.response?.status === 404) {
        setPasswordError('Gallery not found or no longer available.');
      } else if (err.response?.status >= 500) {
        setPasswordError('Server error. Please try again later.');
      } else {
        setPasswordError('Failed to access gallery. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle invitation code submission
  const handleInvitationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInvitationError(null);
    
    try {
      // Fetch gallery data with invitation code
      const url = actualToken
        ? `/share/${actualToken}`
        : `/galleries/${galleryId}/public`;

      const params = { invite: enteredInvitation };
      if (actualToken && password) {
        params.password = password;
      }

      const response = await axios.get(url, { params });
      const data = response.data;

      // Normalize photographer info for consistency
      const respPhotographer = data.photographer || data.gallery?.photographer;
      const normalizedPhotographer = respPhotographer && typeof respPhotographer === 'object'
        ? {
            ...respPhotographer,
            name: respPhotographer.name || `${respPhotographer.firstName || ''} ${respPhotographer.lastName || ''}`.trim(),
            email: respPhotographer.email || respPhotographer.clientEmail || undefined,
          }
        : respPhotographer || undefined;
      const normalizedGallery = {
        ...data.gallery,
        photographer: normalizedPhotographer || (typeof data.gallery?.photographer === 'object'
          ? {
              ...data.gallery.photographer,
              name: data.gallery.photographer.name || `${data.gallery.photographer.firstName || ''} ${data.gallery.photographer.lastName || ''}`.trim(),
            }
          : data.gallery?.photographer),
      };

      setGallery(normalizedGallery);
      setPhotos(data.photos || []);
      setShowInvitationModal(false);
      setError(null);
      setEnteredInvitation('');
    } catch (err) {
      console.error('Invitation submission error:', err);
      if (err.response?.status === 403) {
        setInvitationError('Invalid or expired invitation code. Please try again.');
      } else if (err.response?.status === 404) {
        setInvitationError('Gallery not found or no longer available.');
      } else if (err.response?.status >= 500) {
        setInvitationError('Server error. Please try again later.');
      } else {
        setInvitationError('Failed to access gallery. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Open lightbox
  const openLightbox = (photo, index) => {
    setSelectedPhoto(photo);
    setLightboxIndex(index);
    setShowLightbox(true);
    setZoom(1);
    setRotation(0);
    document.body.style.overflow = 'hidden';
  };
  
  // Close lightbox
  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedPhoto(null);
    setShowInfo(false);
    setZoom(1);
    setRotation(0);
    document.body.style.overflow = 'auto';
  };
  
  // Navigate lightbox
  const navigateLightbox = useCallback((direction) => {
    const newIndex = direction === 'next' 
      ? (lightboxIndex + 1) % photos.length
      : (lightboxIndex - 1 + photos.length) % photos.length;
    setLightboxIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
    setZoom(1);
    setRotation(0);
  }, [lightboxIndex, photos]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showLightbox) return;
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigateLightbox('prev');
          break;
        case 'ArrowRight':
          navigateLightbox('next');
          break;
        case 'i':
        case 'I':
          setShowInfo(!showInfo);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showLightbox, showInfo, lightboxIndex, navigateLightbox]);
  
  // Toggle favorite
  const toggleFavorite = (photoId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(photoId)) {
      newFavorites.delete(photoId);
    } else {
      newFavorites.add(photoId);
    }
    setFavorites(newFavorites);
  };
  
  // Share gallery
  const shareGallery = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: gallery.title,
          text: gallery.description,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Gallery link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share gallery');
    }
  };
  
  // Download photo
  const downloadPhoto = async (photo) => {
    try {
      const response = await axios.get(`/photos/${photo._id}/download`, {
        params: token ? { token } : undefined,
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename || `photo-${photo._id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Photo downloaded successfully!');
    } catch (err) {
      console.error('Error downloading photo:', err);
      toast.error('Failed to download photo');
    }
  };
  
  // Handle inquiry about a photo
  const handleInquiry = (photo) => {
    const subject = `Inquiry about "${photo.title || 'Artwork'}"`;
    const body = `Hi,\n\nI'm interested in learning more about the artwork "${photo.title || 'this piece'}"${photo.metadata?.artworkInfo ? ` (${photo.metadata.artworkInfo.medium}${photo.metadata.artworkInfo.year ? `, ${photo.metadata.artworkInfo.year}` : ''})` : ''}.\n\n${photo.metadata?.purchaseInfo?.price ? `Listed price: $${photo.metadata.purchaseInfo.price.toLocaleString()}\n\n` : ''}Please provide more information about:\n- Availability\n- Pricing details\n- Shipping information\n- Any additional details\n\nThank you!`;
    const recipient = (gallery && gallery.photographer && gallery.photographer.email) ? gallery.photographer.email : '';
    const mailtoLink = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format camera settings
  const formatCameraSettings = (exif) => {
    if (!exif) return null;
    
    const settings = [];
    if (exif.fNumber) settings.push(`f/${exif.fNumber}`);
    if (exif.exposureTime) settings.push(`${exif.exposureTime}s`);
    if (exif.iso) settings.push(`ISO ${exif.iso}`);
    if (exif.focalLength) settings.push(`${exif.focalLength}mm`);
    
    return settings.length > 0 ? settings.join(' • ') : null;
  };
  

  
  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="gallery-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Gallery</h2>
          <p className="error-message">{error}</p>
          
          <div className="error-actions">
            <button 
              onClick={() => {
                setError(null);
                setRetryCount(0);
                fetchGallery();
              }} 
              className="retry-button"
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            
            {retryCount > 2 && (
              <button 
                onClick={() => window.location.href = '/'} 
                className="home-button"
              >
                Go to Homepage
              </button>
            )}
          </div>
          
          {retryCount > 1 && (
            <div className="error-help">
              <p>Still having trouble? Try:</p>
              <ul>
                <li>Checking your internet connection</li>
                <li>Refreshing the page</li>
                <li>Contacting the gallery owner</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`gallery-view ${theme}`} style={{ backgroundColor: theme === 'dark' ? darkBg : lightBg }}>
      {/* Animated Background Elements */}
      <div className="animated-background">
        <motion.div 
          className="bg-gradient-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="bg-gradient-2"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="bg-gradient-3"
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
       </div>
      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="password-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="password-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="password-modal-header">
                <Lock className="lock-icon" />
                <h2>Password Required</h2>
                <p>This gallery is password protected</p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <div className="password-input-container">
                  <input
                    type="password"
                    value={enteredPassword}
                    onChange={(e) => {
                      setEnteredPassword(e.target.value);
                      setPasswordError(null); // Clear error when user types
                    }}
                    placeholder="Enter password"
                    className={`password-input ${passwordError ? 'error' : ''}`}
                    autoFocus
                    required
                    disabled={loading}
                  />
                  {passwordError && (
                    <div className="password-error">
                      <span className="error-icon">⚠️</span>
                      <span className="error-text">{passwordError}</span>
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="password-submit"
                  disabled={loading || !enteredPassword.trim()}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Unlock className="unlock-icon" />
                      Access Gallery
                    </>
                  )}
                </button>
              </form>
              
              <div className="password-modal-footer">
                <p className="help-text">
                  Don't have the password? Contact the gallery owner.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invitation Modal */}
      <AnimatePresence>
        {showInvitationModal && (
          <motion.div 
            className="password-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="password-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="password-modal-header">
                <Lock className="lock-icon" />
                <h2>Invitation Required</h2>
                <p>This gallery is invite-only. Please enter your invitation code.</p>
              </div>
              
              <form onSubmit={handleInvitationSubmit} className="password-form">
                <div className="password-input-container">
                  <input
                    type="text"
                    value={enteredInvitation}
                    onChange={(e) => {
                      setEnteredInvitation(e.target.value);
                      setInvitationError(null); // Clear error when user types
                    }}
                    placeholder="Enter invitation code"
                    className={`password-input ${invitationError ? 'error' : ''}`}
                    autoFocus
                    required
                    disabled={loading}
                  />
                  {invitationError && (
                    <div className="password-error">
                      <span className="error-icon">⚠️</span>
                      <span className="error-text">{invitationError}</span>
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="password-submit"
                  disabled={loading || !enteredInvitation.trim()}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Unlock className="unlock-icon" />
                      Access Gallery
                    </>
                  )}
                </button>
              </form>
              
              <div className="password-modal-footer">
                <p className="help-text">
                  Don't have an invitation code? Contact the gallery owner.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Gallery Header */}
      {gallery && (
        <motion.div 
          className="gallery-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="gallery-info">
            <motion.h1 
              className="gallery-title"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {gallery.title}
            </motion.h1>
            {gallery.description && (
              <motion.p 
                className="gallery-description"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {gallery.description}
              </motion.p>
            )}
            
            <motion.div 
              className="gallery-meta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {gallery.photographer && (
                <motion.div 
                  className="photographer-info"
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="meta-icon-container">
                    <Camera className="meta-icon" />
                  </div>
                  <div className="photographer-details">
                    <span>by {gallery.photographer.name}</span>
                    {gallery.photographerBio && (
                      <p className="photographer-bio">{gallery.photographerBio}</p>
                    )}
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                className="photo-count"
                whileHover={{ scale: 1.05, x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="meta-icon-container">
                  <Eye className="meta-icon" />
                </div>
                <span>{photos.length} photos</span>
              </motion.div>
              
              {gallery.createdAt && (
                <motion.div 
                  className="gallery-date"
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="meta-icon-container">
                    <Calendar className="meta-icon" />
                  </div>
                  <span>{formatDate(gallery.createdAt)}</span>
                </motion.div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            className="gallery-actions"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button 
              onClick={shareGallery} 
              className="action-button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Share2 className="action-icon" />
              <span>Share</span>
            </motion.button>
            <motion.button 
              onClick={toggleTheme} 
              className="action-button theme-toggle" 
              aria-label="Toggle theme"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                {theme === 'dark' ? <Sun className="action-icon" /> : <Moon className="action-icon" />}
              </motion.div>
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Photo Grid */}
      {photos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="photo-masonry"
            columnClassName="photo-masonry-column"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={photo._id}
                className="photo-item"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isSharedView) {
                    navigate(`/gallery/${actualToken}/photo/${photo._id}`);
                  } else {
                    openLightbox(photo, index);
                  }
                }}
              >
              <div className="photo-container">
                <LazyLoadImage
                  src={photo.previewUrl || photo.thumbnailUrl || photo.url}
                  alt={photo.title || 'Gallery photo'}
                  effect="blur"
                  className="photo-image"
                  placeholderSrc={photo.thumbnailUrl}
                />
                
                {/* Visible caption below photo */}
                <motion.div 
                  className="photo-caption"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  {photo.title && (
                    <div className="caption-title">
                      {photo.title}
                    </div>
                  )}
                  
                  {photo.metadata?.purchaseInfo?.price && (
                    <div className="caption-price">
                      ${photo.metadata.purchaseInfo.price.toLocaleString()}
                    </div>
                  )}
                  
                  {!photo.title && !photo.metadata?.purchaseInfo?.price && (
                    <div className="caption-placeholder">
                      Untitled Artwork
                    </div>
                  )}
                </motion.div>
                
                <motion.div 
                  className="photo-overlay"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="photo-actions"
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <motion.button 
                      className={`favorite-button ${favorites.has(photo._id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo._id);
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Heart className="action-icon" />
                    </motion.button>
                    
                    <motion.button 
                      className="download-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Download className="action-icon" />
                    </motion.button>
                  </motion.div>
                  
                  <motion.div 
                    className="photo-info"
                    initial={{ y: 30, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    {photo.title && (
                      <motion.div 
                        className="photo-title"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {photo.title}
                      </motion.div>
                    )}
                    
                    {photo.metadata && (
                      <motion.div 
                        className="photo-metadata"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >

                        

                        
                        {photo.tags && photo.tags.length > 0 && (
                          <div className="photo-tags">
                            {photo.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="photo-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {photo.metadata.purchaseInfo && photo.metadata.purchaseInfo.price && (
                          <motion.div 
                            className="photo-price"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            ${photo.metadata.purchaseInfo.price.toLocaleString()}
                          </motion.div>
                        )}
                        
                        {photo.metadata.purchaseInfo && photo.metadata.purchaseInfo.available && (
                          <motion.button 
                            className="inquiry-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInquiry(photo);
                            }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            Inquire
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ))}
          </Masonry>
        </motion.div>
      ) : (
        <div className="empty-gallery">
          <Camera className="empty-icon" />
          <h3>No photos in this gallery</h3>
          <p>This gallery doesn't contain any photos yet.</p>
        </div>
      )}
      
      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && selectedPhoto && (
          <motion.div 
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            ref={lightboxRef}
          >
            <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
              {/* Lightbox Header */}
              <div className="lightbox-header">
                <div className="lightbox-title">
                  {selectedPhoto.title || `Photo ${lightboxIndex + 1} of ${photos.length}`}
                </div>
                
                <div className="lightbox-controls">
                  <button 
                    className="lightbox-button"
                    onClick={() => setShowInfo(!showInfo)}
                    title="Toggle Info"
                  >
                    <Info className="control-icon" />
                  </button>
                  
                  <button 
                    className="lightbox-button"
                    onClick={() => downloadPhoto(selectedPhoto)}
                    title="Download"
                  >
                    <Download className="control-icon" />
                  </button>
                  
                  <button 
                    className="lightbox-button"
                    onClick={closeLightbox}
                    title="Close"
                  >
                    <X className="control-icon" />
                  </button>
                </div>
              </div>
              
              {/* Lightbox Content */}
              <div className="lightbox-content">
                {/* Navigation */}
                <button 
                  className="lightbox-nav lightbox-nav-prev"
                  onClick={() => navigateLightbox('prev')}
                  disabled={photos.length <= 1}
                >
                  <ChevronLeft className="nav-icon" />
                </button>
                
                <button 
                  className="lightbox-nav lightbox-nav-next"
                  onClick={() => navigateLightbox('next')}
                  disabled={photos.length <= 1}
                >
                  <ChevronRight className="nav-icon" />
                </button>
                
                {/* Image */}
                <div className="lightbox-image-container">
                  <img
                    ref={imageRef}
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title || 'Gallery photo'}
                    className="lightbox-image"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                  />
                </div>
                
                {/* Zoom Controls */}
                <div className="lightbox-zoom-controls">
                  <button 
                    className="zoom-button"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="zoom-icon" />
                  </button>
                  
                  <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                  
                  <button 
                    className="zoom-button"
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="zoom-icon" />
                  </button>
                  
                  <button 
                    className="rotate-button"
                    onClick={() => setRotation((rotation + 90) % 360)}
                  >
                    <RotateCw className="rotate-icon" />
                  </button>
                </div>
              </div>
              
              {/* Photo Info Panel */}
              <AnimatePresence>
                {showInfo && (
                  <motion.div 
                    className="photo-info-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  >
                    <div className="info-header">
                      <h3>Photo Information</h3>
                      <button 
                        className="info-close"
                        onClick={() => setShowInfo(false)}
                      >
                        <X className="close-icon" />
                      </button>
                    </div>
                    
                    <div className="info-content">
                      {selectedPhoto.title && (
                        <div className="info-item">
                          <label>Title</label>
                          <span>{selectedPhoto.title}</span>
                        </div>
                      )}
                      
                      {selectedPhoto.metadata?.description && (
                        <div className="info-item">
                          <label>Description</label>
                          <span>{selectedPhoto.metadata.description}</span>
                        </div>
                      )}
                      
                      {/* Artwork Information */}
                      {selectedPhoto.metadata?.artworkInfo && (
                        <div className="info-section">
                          <h4 className="section-title">Artwork Details</h4>
                          
                          {selectedPhoto.metadata.artworkInfo.medium && (
                            <div className="info-item">
                              <label>Medium</label>
                              <span>{selectedPhoto.metadata.artworkInfo.medium}</span>
                            </div>
                          )}
                          
                          {selectedPhoto.metadata.artworkInfo.dimensions && (
                            <div className="info-item">
                              <label>Dimensions</label>
                              <span>{selectedPhoto.metadata.artworkInfo.dimensions}</span>
                            </div>
                          )}
                          
                          {selectedPhoto.metadata.artworkInfo.year && (
                            <div className="info-item">
                              <label>Year</label>
                              <span>{selectedPhoto.metadata.artworkInfo.year}</span>
                            </div>
                          )}
                          
                          {selectedPhoto.metadata.artworkInfo.artist && (
                            <div className="info-item">
                              <label>Artist</label>
                              <span>{selectedPhoto.metadata.artworkInfo.artist}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Purchase Information */}
                      {selectedPhoto.metadata?.purchaseInfo && (
                        <div className="info-section">
                          <h4 className="section-title">Purchase Information</h4>
                          
                          {selectedPhoto.metadata.purchaseInfo.price && (
                            <div className="info-item price-item">
                              <label>Price</label>
                              <span className="price-value">${selectedPhoto.metadata.purchaseInfo.price.toLocaleString()}</span>
                            </div>
                          )}
                          
                          <div className="info-item">
                            <label>Availability</label>
                            <span className={`availability ${selectedPhoto.metadata.purchaseInfo.available ? 'available' : 'unavailable'}`}>
                              {selectedPhoto.metadata.purchaseInfo.available ? 'Available' : 'Sold'}
                            </span>
                          </div>
                          
                          {selectedPhoto.metadata.purchaseInfo.edition && (
                            <div className="info-item">
                              <label>Edition</label>
                              <span>{selectedPhoto.metadata.purchaseInfo.edition}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Technical Information */}
                      <div className="info-section">
                        <h4 className="section-title">Technical Details</h4>
                        
                        {selectedPhoto.dateTaken && (
                          <div className="info-item">
                            <label>Date Taken</label>
                            <span>{formatDate(selectedPhoto.dateTaken)}</span>
                          </div>
                        )}
                        
                        {selectedPhoto.location && (
                          <div className="info-item">
                            <label>Location</label>
                            <span>{selectedPhoto.location}</span>
                          </div>
                        )}
                        
                        {selectedPhoto.exifData && (
                          <>
                            {selectedPhoto.exifData.camera && (
                              <div className="info-item">
                                <label>Camera</label>
                                <span>{selectedPhoto.exifData.camera}</span>
                              </div>
                            )}
                            
                            {selectedPhoto.exifData.lens && (
                              <div className="info-item">
                                <label>Lens</label>
                                <span>{selectedPhoto.exifData.lens}</span>
                              </div>
                            )}
                            
                            {formatCameraSettings(selectedPhoto.exifData) && (
                              <div className="info-item">
                                <label>Settings</label>
                                <span>{formatCameraSettings(selectedPhoto.exifData)}</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="info-item">
                          <label>Dimensions</label>
                          <span>{selectedPhoto.width} × {selectedPhoto.height}</span>
                        </div>
                        
                        {selectedPhoto.fileSize && (
                          <div className="info-item">
                            <label>File Size</label>
                            <span>{(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Inquiry Section */}
                      {selectedPhoto.metadata?.purchaseInfo?.available && (
                        <div className="info-section inquiry-section">
                          <button 
                            className="inquiry-button-large"
                            onClick={() => handleInquiry(selectedPhoto)}
                          >
                            <Mail className="inquiry-icon" />
                            Inquire About This Artwork
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 };
 
 export default GalleryView;

