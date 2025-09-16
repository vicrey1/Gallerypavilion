import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const CreateGalleryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    collections: [],
    settings: {
      allowDownload: false,
      showMetadata: true,
      enableComments: false,
      watermarkIntensity: 0.3,
      requirePassword: false,
      password: '',
      isPublished: true,
      expirationDate: '',
      allowInquiries: true,
      inviteOnly: false
    }
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [newCollection, setNewCollection] = useState('');
  const [errors, setErrors] = useState({});

  const categories = [
    'Portrait', 'Wedding', 'Landscape', 'Wildlife', 'Street',
    'Fashion', 'Commercial', 'Fine Art', 'Event', 'Documentary'
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox'
            ? checked
            : (settingName === 'watermarkIntensity' ? parseFloat(value) : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing (supports nested settings fields)
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle cover image upload
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Prepare settings strictly matching backend schema
      const rawSettings = { ...formData.settings };

      // Map numeric intensity (0..1) to enum: 'light' | 'medium' | 'heavy'
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
        sortOrder: rawSettings.sortOrder || 'newest',
        inviteOnly: !!rawSettings.inviteOnly
      };

      // Add gallery data - ensure proper formatting and trimming
      submitData.append('title', (formData.title || '').trim());
      submitData.append('description', (formData.description || '').trim());
      submitData.append('category', formData.category);
      submitData.append('collections', JSON.stringify((formData.collections || []).map(c => c.trim()).filter(Boolean)));
      submitData.append('settings', JSON.stringify(settingsPayload));
      
      // Add cover image if selected
      if (coverImage) {
        submitData.append('coverImage', coverImage);
      }
      
      // Debug: Log what's being sent
      console.log('Submitting gallery data:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        collections: formData.collections,
        settings: settingsPayload
      });
      
      const response = await axios.post('/galleries', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Gallery created successfully!');
        navigate(`/gallery/${response.data.gallery._id}/edit`);
      } else {
        throw new Error(response.data.message || 'Failed to create gallery');
      }
      
    } catch (err) {
      console.error('Error creating gallery:', err);
      
      // Log detailed error information
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      }
      
      const errorMessage = err.response?.data?.message || 'Failed to create gallery';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = {};
        err.response.data.errors.forEach(error => {
          const key = error.path || error.param || error.field;
          if (key) {
            validationErrors[key] = error.msg || error.message || 'Invalid value';
          }
        });
        const firstError = Object.values(validationErrors)[0];
        if (firstError) {
          toast.error(firstError);
        }
        setErrors(validationErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to create a gallery.</p>
          <Link to="/login" className="btn-primary">
            Log In
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
              <Link to="/galleries" className="text-gray-600 hover:text-gray-900">
                ← Back to Galleries
              </Link>
              <Link to="/" className="text-2xl font-serif font-bold gradient-text">
                Gallery Pavilion
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Create New Gallery
            </h1>
            <p className="text-gray-600">
              Set up a new photo gallery for your clients. You can add photos after creating the gallery.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
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

            {/* Gallery Settings */}
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
                      id="isPublished"
                      name="settings.isPublished"
                      checked={formData.settings.isPublished}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                      Publish gallery (make visible to clients)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowInquiries"
                      name="settings.allowInquiries"
                      checked={formData.settings.allowInquiries}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowInquiries" className="ml-2 block text-sm text-gray-700">
                      Allow client inquiries
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

                  {/* Default Sort Order */}
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                      Default photo sort order
                    </label>
                    <select
                      id="sortOrder"
                      name="settings.sortOrder"
                      value={formData.settings.sortOrder || 'newest'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="custom">Custom (manual)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Controls how photos are ordered for viewers.</p>
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
                
                {/* Expiration Date */}
                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Gallery Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="expirationDate"
                    name="settings.expirationDate"
                    value={formData.settings.expirationDate}
                    onChange={handleInputChange}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Gallery will automatically become inaccessible after this date
                  </p>
                </div>

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
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                to="/galleries"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{loading ? 'Creating...' : 'Create Gallery'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateGalleryPage;