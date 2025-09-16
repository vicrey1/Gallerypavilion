import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Plus, Trash2 } from 'lucide-react';

const PhotoEditForm = ({ photo, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    artwork: {
      year: '',
      series: '',
      edition: '',
      authenticity: '',
      materials: '',
      dimensions: '',
      signature: '',
      medium: '',
      condition: 'Excellent',
      rarity: 'Common',
      certificate: false,
      frame: '',
      context: '',
      isForSale: false,
      price: '',
      currency: 'USD'
    },
    artist: {
      biography: '',
      yearsActive: ''
    },
    tags: []
  });



  const [newTag, setNewTag] = useState('');
  const [loading, setSaving] = useState(false);

  useEffect(() => {
    if (photo) {
      setFormData({
        title: photo.title || '',
        description: photo.description || '',
        artwork: {
          year: photo.artwork?.year || '',
          series: photo.artwork?.series || '',
          edition: photo.artwork?.edition || '',
          authenticity: photo.artwork?.authenticity || '',
          materials: photo.artwork?.materials || '',
          dimensions: photo.artwork?.dimensions || '',
          signature: photo.artwork?.signature || '',
          medium: photo.artwork?.medium || '',
          condition: photo.artwork?.condition || 'Excellent',
          rarity: photo.artwork?.rarity || 'Common',
          certificate: photo.artwork?.certificate || false,
          frame: photo.artwork?.frame || '',
          context: photo.artwork?.context || '',
          isForSale: photo.artwork?.isForSale || false,
          price: photo.artwork?.price || '',
          currency: photo.artwork?.currency || 'USD'
        },
        artist: {
          biography: photo.artist?.biography || '',
          yearsActive: photo.artist?.yearsActive || ''
        },
        tags: photo.tags || []
      });
    }
  }, [photo]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };





  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving photo:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Photo Details</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange(null, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange(null, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={500}
                  />
                </div>
              </div>
            </section>

            {/* Artwork Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Artwork Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Materials
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.materials}
                    onChange={(e) => handleInputChange('artwork', 'materials', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Archival pigment print"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.dimensions}
                    onChange={(e) => handleInputChange('artwork', 'dimensions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 24 × 36 in"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medium
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.medium}
                    onChange={(e) => handleInputChange('artwork', 'medium', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Photography"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.artwork.year}
                    onChange={(e) => handleInputChange('artwork', 'year', parseInt(e.target.value) || '')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={1800}
                    max={new Date().getFullYear() + 10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition
                  </label>
                  <select
                    value={formData.artwork.condition}
                    onChange={(e) => handleInputChange('artwork', 'condition', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rarity
                  </label>
                  <select
                    value={formData.artwork.rarity}
                    onChange={(e) => handleInputChange('artwork', 'rarity', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Unique">Unique</option>
                    <option value="Rare">Rare</option>
                    <option value="Scarce">Scarce</option>
                    <option value="Common">Common</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Series
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.series}
                    onChange={(e) => handleInputChange('artwork', 'series', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Urban Landscapes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signature
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.signature}
                    onChange={(e) => handleInputChange('artwork', 'signature', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Signed on verso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frame
                  </label>
                  <input
                    type="text"
                    value={formData.artwork.frame}
                    onChange={(e) => handleInputChange('artwork', 'frame', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Custom black frame"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="certificate"
                    checked={formData.artwork.certificate}
                    onChange={(e) => handleInputChange('artwork', 'certificate', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="certificate" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Certificate of Authenticity
                  </label>
                </div>
              </div>
            </section>

            {/* Artist Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Artist Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biography
                  </label>
                  <textarea
                    value={formData.artist.biography}
                    onChange={(e) => handleInputChange('artist', 'biography', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={1000}
                    placeholder="Artist biography and background..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years Active
                  </label>
                  <input
                    type="text"
                    value={formData.artist.yearsActive}
                    onChange={(e) => handleInputChange('artist', 'yearsActive', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1990-present"
                  />
                </div>




              </div>
            </section>

            {/* Tags */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PhotoEditForm;