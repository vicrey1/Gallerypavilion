import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  CalendarIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const ShareLinkForm = ({ onCreateShare }) => {
  const [formData, setFormData] = useState({
    name: '',
    allowDownloads: false,
    showExif: false,
    watermarkEnabled: false,
    expiresAt: '',
    password: '',
    maxViews: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const shareData = {
        name: formData.name.trim(),
        allowDownloads: !!formData.allowDownloads,
        showExif: !!formData.showExif,
        watermarkEnabled: !!formData.watermarkEnabled,
        maxViews: formData.maxViews ? parseInt(formData.maxViews, 10) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        password: formData.password && formData.password.length > 0 ? formData.password : undefined
      };
      
      await onCreateShare(shareData);
      
      // Reset form
    setFormData({
      name: '',
      allowDownloads: false,
      showExif: false,
      watermarkEnabled: false,
      expiresAt: '',
      password: '',
      maxViews: ''
    });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Share Link Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Share Link Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Client Preview, Public Gallery"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      {/* Permissions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Permissions
        </label>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowDownloads"
              name="allowDownloads"
              checked={formData.allowDownloads}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="allowDownloads" className="ml-2 flex items-center text-sm text-gray-700">
              <GlobeAltIcon className="w-4 h-4 mr-1" />
              Allow photo downloads
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showExif"
              name="showExif"
              checked={formData.showExif}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="showExif" className="ml-2 flex items-center text-sm text-gray-700">
              <EyeIcon className="w-4 h-4 mr-1" />
              Show EXIF metadata
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="watermarkEnabled"
              name="watermarkEnabled"
              checked={formData.watermarkEnabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="watermarkEnabled" className="ml-2 text-sm text-gray-700">
              Enable watermarks
            </label>
          </div>
        </div>
      </div>

      {/* Expiration and Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Expires At (Optional)
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="maxViews" className="block text-sm font-medium text-gray-700 mb-2">
            Max Views (Optional)
          </label>
          <input
            type="number"
            id="maxViews"
            name="maxViews"
            value={formData.maxViews}
            onChange={handleInputChange}
            placeholder="Unlimited"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Password Protection */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          <LockClosedIcon className="w-4 h-4 inline mr-1" />
          Password Protection (Optional)
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Leave empty for no password"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Share Link'}
        </button>
      </div>
    </motion.form>
  );
};

export default ShareLinkForm;