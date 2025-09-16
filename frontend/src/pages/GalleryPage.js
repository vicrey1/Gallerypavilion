import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ArrowLeftIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  Cog6ToothIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  ShareIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ShareLinkForm from '../components/ShareLinkForm';
import ShareLinksList from '../components/ShareLinksList';
import InviteManager from '../components/InviteManager';

const GalleryPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'edit');
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    collections: [],
    photographerBio: '',
    settings: {
      allowDownload: false,
      showMetadata: true,
      enableComments: false,
      watermarkIntensity: 0.3,
      requirePassword: false,
      password: '',
      inviteOnly: false,
      sortOrder: 'newest'
    },
    isPublished: false
  });
  const [errors, setErrors] = useState({});
  const [newCollection, setNewCollection] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [shareLinks, setShareLinks] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  
  // Photo metadata editing
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [photoMetadata, setPhotoMetadata] = useState({
    title: '',
    description: '',
    tags: [],
    artworkInfo: {
      year: '',
      series: '',
      edition: '',
      size: '',
      materials: ''
    },
    artwork: {
      medium: '',
      condition: 'Excellent',
      rarity: 'Common',
      signature: '',
      provenance: ''
    },
    artist: {
      biography: ''
    },
    purchaseInfo: {
      price: '',
      priceOnRequest: false,
      availability: 'available',
      shippingInfo: '',
      returnPolicy: ''
    },
    context: {
      artistStatement: '',
      exhibitionHistory: ''
    }
  });

  const categories = [
    'Portrait', 'Wedding', 'Landscape', 'Wildlife', 'Street', 
    'Fashion', 'Commercial', 'Fine Art', 'Event', 'Documentary'
  ];

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/galleries/${id}`);
      const galleryData = response.data;
      setGallery(galleryData);
      
      // Normalize watermarkIntensity for UI slider if backend returns enum
      const rawIntensity = galleryData.settings?.watermarkIntensity;
      let intensityNumber;
      if (typeof rawIntensity === 'number') {
        intensityNumber = rawIntensity;
      } else if (typeof rawIntensity === 'string') {
        if (['light', 'medium', 'heavy'].includes(rawIntensity)) {
          intensityNumber = rawIntensity === 'light' ? 0.2 : (rawIntensity === 'medium' ? 0.5 : 0.85);
        } else {
          const num = parseFloat(rawIntensity);
          intensityNumber = Number.isFinite(num) ? num : 0.3;
        }
      } else {
        intensityNumber = 0.3;
      }
      
      // Populate form data
      setFormData({
        title: galleryData.title || '',
        description: galleryData.description || '',
        category: galleryData.category || '',
        collections: galleryData.collections || [],
        photographerBio: galleryData.photographerBio || '',
        settings: {
          allowDownload: galleryData.settings?.allowDownload || false,
          showMetadata: galleryData.settings?.showMetadata || true,
          enableComments: galleryData.settings?.enableComments || false,
          watermarkIntensity: intensityNumber,
          requirePassword: galleryData.settings?.requirePassword || false,
          password: galleryData.settings?.password || '',
          inviteOnly: galleryData.settings?.inviteOnly || false,
          sortOrder: galleryData.settings?.sortOrder || 'newest'
        },
        isPublished: galleryData.isPublished || false
      });

      if (galleryData.coverImage) {
        setCoverImagePreview(galleryData.coverImage.previewUrl || null);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await axios.get(`/galleries/${id}/photos`);
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, [id]);

  // Fetch share links
  const fetchShareLinks = useCallback(async () => {
    try {
      setLoadingShares(true);
      const response = await axios.get(`/galleries/${id}/shares`);
      setShareLinks(response.data.shares || []);
    } catch (error) {
      console.error('Error fetching share links:', error);
      toast.error('Failed to fetch share links');
    } finally {
      setLoadingShares(false);
    }
  }, [id]);

  // Create share link
  const createShareLink = async (shareData) => {
    try {
      const response = await axios.post(`/galleries/${id}/shares`, shareData);
      setShareLinks(prev => [...prev, response.data.share]);
      toast.success('Share link created successfully');
      return response.data.share;
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error(error.response?.data?.message || 'Failed to create share link');
      throw error;
    }
  };

  // Delete share link
  const deleteShareLink = async (shareId) => {
    try {
      await axios.delete(`/galleries/${id}/shares/${shareId}`);
      setShareLinks(prev => prev.filter(share => share._id !== shareId));
      toast.success('Share link deleted successfully');
    } catch (error) {
      console.error('Error deleting share link:', error);
      toast.error('Failed to delete share link');
    }
  };

  // Fetch gallery data
  useEffect(() => {
    if (id) {
      fetchGallery();
      fetchPhotos();
      fetchShareLinks();
    }
  }, [id, fetchGallery, fetchPhotos, fetchShareLinks]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : (settingName === 'watermarkIntensity' ? parseFloat(value) : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle cover image upload
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover image must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setCoverImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove cover image
  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  // Add collection
  const addCollection = () => {
    if (newCollection.trim() && !formData.collections.includes(newCollection.trim())) {
      setFormData(prev => ({
        ...prev,
        collections: [...prev.collections, newCollection.trim()]
      }));
      setNewCollection('');
    }
  };

  // Remove collection
  const removeCollection = (index) => {
    setFormData(prev => ({
      ...prev,
      collections: prev.collections.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Gallery title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Gallery description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (formData.settings.requirePassword && !formData.settings.password.trim()) {
      newErrors['settings.password'] = 'Password is required when password protection is enabled';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save gallery changes
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSaving(true);
    
    try {
      const submitData = new FormData();
      
      // Prepare settings strictly matching backend schema
      const rawSettings = { ...formData.settings };
      const numericIntensity = typeof rawSettings.watermarkIntensity === 'number'
        ? rawSettings.watermarkIntensity
        : parseFloat(rawSettings.watermarkIntensity || 0.5);
      const watermarkEnum = Number.isFinite(numericIntensity)
        ? (numericIntensity <= 0.33 ? 'light' : (numericIntensity <= 0.66 ? 'medium' : 'heavy'))
        : 'medium';
      const settingsPayload = {
        allowDownload: !!rawSettings.allowDownload,
        showMetadata: !!rawSettings.showMetadata,
        enableComments: !!rawSettings.enableComments,
        watermarkIntensity: watermarkEnum,
        sortOrder: ['newest', 'oldest', 'custom'].includes(rawSettings.sortOrder) ? rawSettings.sortOrder : 'newest',
        inviteOnly: !!rawSettings.inviteOnly
      };
      const collectionsProcessed = (formData.collections || []).map(c => (c || '').toString().trim()).filter(Boolean);
      
      // Add gallery data
      Object.keys(formData).forEach(key => {
        if (key === 'settings') {
          submitData.append('settings', JSON.stringify(settingsPayload));
        } else if (key === 'collections') {
          submitData.append('collections', JSON.stringify(collectionsProcessed));
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add cover image if selected
      if (coverImage) {
        submitData.append('coverImage', coverImage);
      }
      
      const response = await axios.put(`/galleries/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Gallery updated successfully!');
      setGallery(response.data);
      
    } catch (error) {
      console.error('Error updating gallery:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update gallery';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.path] = err.msg;
        });
        setErrors(validationErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  // Upload photos
  const handlePhotoUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }
      
      const response = await axios.post(`/galleries/${id}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`${response.data.photos?.length || 0} photos uploaded successfully!`);
      fetchPhotos(); // Refresh photos list
      
    } catch (error) {
      console.error('Error uploading photos:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload photos';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    handlePhotoUpload(e.target.files);
  };

  // Drag and drop handlers
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        handlePhotoUpload(files);
      } else {
        toast.error('Please drop only image files');
      }
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await axios.delete(`/photos/${photoId}`);
      toast.success('Photo deleted successfully');
      fetchPhotos(); // Refresh photos list
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  // Edit photo metadata
  const handleEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setPhotoMetadata({
      title: photo.title || '',
      description: photo.description || '',
      tags: photo.tags || [],
      artworkInfo: {
        year: photo.artwork?.year || photo.exif?.dateTaken ? new Date(photo.exif.dateTaken).getFullYear().toString() : '',
        series: photo.artwork?.series || '',
        edition: photo.artwork?.edition || '',
        size: photo.artwork?.dimensions || '',
        materials: photo.artwork?.materials || ''
      },
      artwork: {
        medium: photo.artwork?.medium || '',
        condition: (() => {
          const condition = photo.artwork?.condition;
          if (condition === 'excellent') return 'Excellent';
          if (condition === 'very-good' || condition === 'very good') return 'Very Good';
          if (condition === 'good') return 'Good';
          if (condition === 'fair') return 'Fair';
          if (condition === 'poor') return 'Poor';
          return condition || 'Excellent';
        })(),
        rarity: (() => {
          const rarity = photo.artwork?.rarity;
          if (rarity === 'unique') return 'Unique';
          if (rarity === 'rare') return 'Rare';
          if (rarity === 'scarce') return 'Scarce';
          if (rarity === 'common') return 'Common';
          return rarity || 'Common';
        })(),
        signature: photo.artwork?.signature || '',
        provenance: photo.artwork?.provenance || ''
      },
      artist: {
        biography: photo.artist?.biography || ''
      },
      purchaseInfo: {
        price: photo.artwork?.price || '',
        priceOnRequest: !photo.artwork?.price && !!photo.artwork?.isForSale,
        availability: photo.artwork?.isForSale ? 'available' : 'not_available',
        shippingInfo: photo.artwork?.shippingInfo || '',
        returnPolicy: photo.artwork?.returnPolicy || ''
      },
      context: {
        artistStatement: photo.artwork?.context || '',
        exhibitionHistory: photo.context?.exhibitionHistory || ''
      }
    });
  };

  // Save photo metadata
  const handleSavePhotoMetadata = async () => {
    if (!editingPhoto) {
      return;
    }
    
    try {
      // Transform frontend form data to backend Photo model structure
      const updateData = {
        title: photoMetadata.title,
        description: photoMetadata.description,
        tags: photoMetadata.tags,
        artwork: {
          year: photoMetadata.artworkInfo?.year ? parseInt(photoMetadata.artworkInfo.year) : undefined,
          series: photoMetadata.artworkInfo?.series,
          edition: photoMetadata.artworkInfo?.edition,
          dimensions: photoMetadata.artworkInfo?.size,
          materials: photoMetadata.artworkInfo?.materials,
          medium: photoMetadata.artwork?.medium,
          condition: (() => {
            const condition = photoMetadata.artwork?.condition;
            if (condition === 'Excellent') return 'Excellent';
            if (condition === 'Very Good') return 'Very Good';
            if (condition === 'Good') return 'Good';
            if (condition === 'Fair') return 'Fair';
            if (condition === 'Poor') return 'Poor';
            return condition;
          })(),
          rarity: (() => {
            const rarity = photoMetadata.artwork?.rarity;
            if (rarity === 'Unique') return 'Unique';
            if (rarity === 'Rare') return 'Rare';
            if (rarity === 'Scarce') return 'Scarce';
            if (rarity === 'Common') return 'Common';
            return rarity;
          })(),
          signature: photoMetadata.artwork?.signature,
          provenance: photoMetadata.artwork?.provenance,

          price: photoMetadata.purchaseInfo?.price ? parseFloat(photoMetadata.purchaseInfo.price) : undefined,
          isForSale: photoMetadata.purchaseInfo?.availability === 'available' || photoMetadata.purchaseInfo?.priceOnRequest,
          context: photoMetadata.context?.artistStatement,
          shippingInfo: photoMetadata.purchaseInfo?.shippingInfo,
          returnPolicy: photoMetadata.purchaseInfo?.returnPolicy
        },
        artist: {
          biography: photoMetadata.artist?.biography
        }
      };
      
      // Remove undefined values to avoid overwriting existing data with undefined
      Object.keys(updateData.artwork).forEach(key => {
        if (updateData.artwork[key] === undefined || updateData.artwork[key] === '') {
          delete updateData.artwork[key];
        }
      });
      
      Object.keys(updateData.artist).forEach(key => {
        if (updateData.artist[key] === undefined || updateData.artist[key] === '') {
          delete updateData.artist[key];
        }
      });
      
      await axios.put(`/photos/${editingPhoto._id}`, updateData);
      toast.success('Photo metadata updated successfully');
      setEditingPhoto(null);
      fetchPhotos(); // Refresh photos list
    } catch (error) {
      console.error('Error updating photo metadata:', error);
      toast.error('Failed to update photo metadata');
    }
  };

  // Handle metadata input change
  const handleMetadataChange = (field, value) => {
    if (field.includes('.')) {
      const keys = field.split('.');
      setPhotoMetadata(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        
        return newData;
      });
    } else {
      setPhotoMetadata(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Toggle publish status
  const handleTogglePublish = async () => {
    try {
      const newStatus = !formData.isPublished;
      await axios.patch(`/galleries/${id}/status`, {
        isPublished: newStatus
      });
      
      setFormData(prev => ({ ...prev, isPublished: newStatus }));
      toast.success(newStatus ? 'Gallery published!' : 'Gallery unpublished');
      
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update gallery status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to edit galleries.</p>
          <Link to="/login" className="btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery Not Found</h2>
          <p className="text-gray-600 mb-6">The requested gallery could not be found.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <Link to="/" className="text-2xl font-serif font-bold gradient-text">
                Gallery Pavilion
              </Link>
              <span className="text-sm text-gray-500">/ Editing: {gallery.title}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTogglePublish}
                className={`px-4 py-2 rounded-lg font-medium ${
                  formData.isPublished 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } transition-colors`}
              >
                {formData.isPublished ? 'Published' : 'Draft'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'edit', label: 'Edit Gallery', icon: PencilIcon },
                { id: 'photos', label: 'Photos', icon: PhotoIcon },
                { id: 'photographer', label: 'Photographer', icon: UserIcon },
                { id: 'share', label: 'Share Links', icon: ShareIcon },
                { id: 'invitations', label: 'Invitations', icon: UserGroupIcon },
                { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Gallery Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter gallery title"
                      maxLength={100}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    <p className="mt-1 text-sm text-gray-500">{formData.title.length}/100 characters</p>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  {/* Collections */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collections
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCollection}
                        onChange={(e) => setNewCollection(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCollection())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Add collection tag"
                        maxLength={50}
                      />
                      <button
                        type="button"
                        onClick={addCollection}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {formData.collections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.collections.map((collection, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                          >
                            {collection}
                            <button
                              type="button"
                              onClick={() => removeCollection(index)}
                              className="ml-2 text-primary-600 hover:text-primary-800"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe your gallery"
                      maxLength={1000}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    <p className="mt-1 text-sm text-gray-500">{formData.description.length}/1000 characters</p>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cover Image</h2>
                
                {!coverImagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload a cover image for your gallery</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                      id="coverImage"
                    />
                    <label
                      htmlFor="coverImage"
                      className="btn-secondary cursor-pointer"
                    >
                      Choose Image
                    </label>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Photos</h2>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${
                    dragActive ? 'text-primary-500' : 'text-gray-400'
                  }`} />
                  <p className={`mb-4 ${
                    dragActive ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                    {dragActive ? 'Drop photos here!' : 'Drag and drop photos here, or click to browse'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    multiple
                    className="hidden"
                    id="photoUpload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photoUpload"
                    className={`btn-secondary cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Select Photos'}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Up to 20 photos at once, 10MB each • Supports JPG, PNG, WEBP
                  </p>
                  {uploading && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Processing images and generating watermarks...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Grid */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Photos ({photos.length})
                </h2>
                
                {photos.length === 0 ? (
                  <div className="text-center py-12">
                    <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No photos uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">Upload photos to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {photos.map((photo) => (
                      <div key={photo._id} className="group relative">
                        <img
                          src={photo.previewUrl || `/uploads/photos/${photo.filename}`}
                          alt={photo.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            <button className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors">
                              <EyeIcon className="w-4 h-4 text-white" />
                            </button>
                            <button 
                              onClick={() => handleEditPhoto(photo)}
                              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                            >
                              <AdjustmentsHorizontalIcon className="w-4 h-4 text-white" />
                            </button>
                            <button 
                              onClick={() => handleDeletePhoto(photo._id)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                            >
                              <TrashIcon className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Create New Share Link */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Share Link</h2>
                <ShareLinkForm onCreateShare={createShareLink} />
              </div>

              {/* Existing Share Links */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Existing Share Links</h2>
                {loadingShares ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : shareLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShareIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No share links created yet</p>
                    <p className="text-sm">Create your first share link above</p>
                  </div>
                ) : (
                  <ShareLinksList 
                    shareLinks={shareLinks} 
                    onDeleteShare={deleteShareLink}
                    galleryId={id}
                  />
                )}
              </div>
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <InviteManager 
                galleryId={id} 
                isInviteOnly={formData.settings.inviteOnly} 
              />
            </div>
          )}

          {/* Photographer Tab */}
          {activeTab === 'photographer' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">About the Photographer</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="photographerBio" className="block text-sm font-medium text-gray-700 mb-2">
                    Photographer Biography
                  </label>
                  <textarea
                    id="photographerBio"
                    name="photographerBio"
                    rows={8}
                    value={formData.photographerBio}
                    onChange={handleInputChange}
                    placeholder="Write about the photographer's background, experience, artistic vision, and achievements..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-vertical"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This information will be displayed on the photo detail pages. Maximum 2000 characters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Gallery Settings</h2>
              
              <div className="space-y-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowDownload"
                      name="settings.allowDownload"
                      checked={formData.settings.allowDownload}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowDownload" className="ml-2 block text-sm text-gray-700">
                      Allow photo downloads
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showMetadata"
                      name="settings.showMetadata"
                      checked={formData.settings.showMetadata}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showMetadata" className="ml-2 block text-sm text-gray-700">
                      Show photo metadata
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableComments"
                      name="settings.enableComments"
                      checked={formData.settings.enableComments}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableComments" className="ml-2 block text-sm text-gray-700">
                      Enable comments
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requirePassword"
                      name="settings.requirePassword"
                      checked={formData.settings.requirePassword}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requirePassword" className="ml-2 block text-sm text-gray-700">
                      Require password for access
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="inviteOnly"
                      name="settings.inviteOnly"
                      checked={formData.settings.inviteOnly}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="inviteOnly" className="ml-2 block text-sm text-gray-700">
                      Invite-only access (requires invitation code)
                    </label>
                  </div>
                </div>

                {/* Password Field */}
                {formData.settings.requirePassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Gallery Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="settings.password"
                      value={formData.settings.password}
                      onChange={handleInputChange}
                      className={`w-full max-w-md px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors['settings.password'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter gallery password"
                    />
                    {errors['settings.password'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['settings.password']}</p>
                    )}
                  </div>
                )}

                {/* Watermark Intensity */}
                <div>
                  <label htmlFor="watermarkIntensity" className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark Intensity: {Math.round(formData.settings.watermarkIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    id="watermarkIntensity"
                    name="settings.watermarkIntensity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.settings.watermarkIntensity}
                    onChange={handleInputChange}
                    className="w-full max-w-md"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Controls the opacity of watermarks on preview images
                  </p>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) {
                          // Handle delete
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Gallery
                    </button>
                    <p className="text-sm text-gray-600">
                      Once deleted, the gallery and all its photos cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Photo Metadata Editing Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Photo Metadata</h2>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Photo Preview */}
                <div>
                  <img
                    src={editingPhoto.previewUrl || `/uploads/photos/${editingPhoto.filename}`}
                    alt={editingPhoto.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <p className="text-sm text-gray-500">Original: {editingPhoto.originalFilename}</p>
                </div>

                {/* Metadata Form */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={photoMetadata.title}
                          onChange={(e) => handleMetadataChange('title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={photoMetadata.description}
                          onChange={(e) => handleMetadataChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Artwork Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Artwork Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input
                          type="text"
                          value={photoMetadata.artworkInfo?.year || ''}
                          onChange={(e) => handleMetadataChange('artworkInfo.year', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                        <input
                          type="text"
                          value={photoMetadata.artworkInfo?.series || ''}
                          onChange={(e) => handleMetadataChange('artworkInfo.series', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
                        <input
                          type="text"
                          value={photoMetadata.artworkInfo?.edition || ''}
                          onChange={(e) => handleMetadataChange('artworkInfo.edition', e.target.value)}
                          placeholder="e.g., 1/50"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                        <input
                          type="text"
                          value={photoMetadata.artworkInfo?.size || ''}
                          onChange={(e) => handleMetadataChange('artworkInfo.size', e.target.value)}
                          placeholder="e.g., 24x36 inches"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                        <input
                          type="text"
                          value={photoMetadata.artwork?.medium || ''}
                          onChange={(e) => handleMetadataChange('artwork.medium', e.target.value)}
                          placeholder="e.g., Photography, Digital Print"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                        <select
                          value={photoMetadata.artwork?.condition || 'Excellent'}
                          onChange={(e) => handleMetadataChange('artwork.condition', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                        <select
                          value={photoMetadata.artwork?.rarity || 'Common'}
                          onChange={(e) => handleMetadataChange('artwork.rarity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Unique">Unique</option>
                          <option value="Rare">Rare</option>
                          <option value="Scarce">Scarce</option>
                          <option value="Common">Common</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                        <input
                          type="text"
                          value={photoMetadata.artwork?.signature || ''}
                          onChange={(e) => handleMetadataChange('artwork.signature', e.target.value)}
                          placeholder="e.g., Signed lower right"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                        <input
                          type="text"
                          value={photoMetadata.artworkInfo?.materials || ''}
                          onChange={(e) => handleMetadataChange('artworkInfo.materials', e.target.value)}
                          placeholder="e.g., Archival pigment print on cotton paper"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provenance</label>
                        <textarea
                          value={photoMetadata.artwork?.provenance || ''}
                          onChange={(e) => handleMetadataChange('artwork.provenance', e.target.value)}
                          placeholder="History of ownership and exhibition"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Artist Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Artist Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                        <textarea
                          value={photoMetadata.artist?.biography || ''}
                          onChange={(e) => handleMetadataChange('artist.biography', e.target.value)}
                          placeholder="Artist's background and career highlights"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                    </div>
                  </div>



                  {/* Tags */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                    <div className="space-y-2">
                      {(photoMetadata.tags || []).map((tag, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => {
                              const newTags = [...(photoMetadata.tags || [])];
                              newTags[index] = e.target.value;
                              handleMetadataChange('tags', newTags);
                            }}
                            placeholder="Tag"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = (photoMetadata.tags || []).filter((_, i) => i !== index);
                              handleMetadataChange('tags', newTags);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = [...(photoMetadata.tags || []), ''];
                          handleMetadataChange('tags', newTags);
                        }}
                        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Purchase Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="text"
                            value={photoMetadata.purchaseInfo.price}
                            onChange={(e) => handleMetadataChange('purchaseInfo.price', e.target.value)}
                            placeholder="$2,500"
                            disabled={photoMetadata.purchaseInfo.priceOnRequest}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="priceOnRequest"
                            checked={photoMetadata.purchaseInfo.priceOnRequest}
                            onChange={(e) => handleMetadataChange('purchaseInfo.priceOnRequest', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="priceOnRequest" className="ml-2 text-sm text-gray-700">
                            Price on Request
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                        <select
                          value={photoMetadata.purchaseInfo.availability}
                          onChange={(e) => handleMetadataChange('purchaseInfo.availability', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="available">Available</option>
                          <option value="sold">Sold</option>
                          <option value="reserved">Reserved</option>
                          <option value="not-for-sale">Not for Sale</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePhotoMetadata}
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;