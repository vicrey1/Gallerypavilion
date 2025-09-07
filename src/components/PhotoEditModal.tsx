'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { X, DollarSign, Tag, MapPin, Image as IconImage, Award, FileText } from 'lucide-react'

interface Photo {
  id: string
  title?: string
  description?: string
  url: string
  thumbnailUrl: string
  price?: number
  isForSale: boolean
  tags: string[]
  category?: string
  location?: string
  editionNumber?: number
  totalEditions?: number
  medium?: string
  technique?: string
  materials?: string
  artistStatement?: string
  provenance?: string
  certificateId?: string
}

interface PhotoEditModalProps {
  photo: Photo
  isOpen: boolean
  onClose: () => void
  onSave: (photoData: Partial<Photo>) => Promise<void>
}

export default function PhotoEditModal({ photo, isOpen, onClose, onSave }: PhotoEditModalProps) {
  const [formData, setFormData] = useState({
    title: photo.title || '',
    description: photo.description || '',
    price: photo.price || 0,
    isForSale: photo.isForSale,
    tags: photo.tags.join(', '),
    category: photo.category || '',
    location: photo.location || '',
    editionNumber: photo.editionNumber || 1,
    totalEditions: photo.totalEditions || 1,
    medium: photo.medium || '',
    technique: photo.technique || '',
    materials: photo.materials || '',
    artistStatement: photo.artistStatement || '',
    provenance: photo.provenance || '',
    certificateId: photo.certificateId || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: photo.title || '',
        description: photo.description || '',
        price: photo.price || 0,
        isForSale: photo.isForSale,
        tags: photo.tags.join(', '),
        category: photo.category || '',
        location: photo.location || '',
        editionNumber: photo.editionNumber || 1,
        totalEditions: photo.totalEditions || 1,
        medium: photo.medium || '',
        technique: photo.technique || '',
        materials: photo.materials || '',
        artistStatement: photo.artistStatement || '',
        provenance: photo.provenance || '',
        certificateId: photo.certificateId || ''
      })
      setErrors({})
    }
  }, [photo, isOpen])

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      await onSave({
        title: formData.title,
        description: formData.description,
        price: formData.price,
        isForSale: formData.isForSale,
        tags: tagsArray,
        category: formData.category,
        location: formData.location,
        editionNumber: formData.editionNumber,
        totalEditions: formData.totalEditions,
        medium: formData.medium,
        technique: formData.technique,
        materials: formData.materials,
        artistStatement: formData.artistStatement,
        provenance: formData.provenance,
        certificateId: formData.certificateId
      })
      onClose()
    } catch (error) {
      console.error('Error saving photo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Preview */}
          <div className="flex items-center space-x-4">
            <NextImage
              src={photo.thumbnailUrl}
              alt={photo.title ? `Thumbnail for ${photo.title}` : 'Photo thumbnail'}
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-medium text-gray-900">{photo.title || 'Untitled Photo'}</h3>
              <p className="text-sm text-gray-500">Photo ID: {photo.id}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <IconImage className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter photo title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter photo description"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing
            </h3>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="isForSale"
                checked={formData.isForSale}
                onChange={(e) => handleInputChange('isForSale', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isForSale" className="text-sm font-medium text-gray-700">
                Available for sale
              </label>
            </div>

            {formData.isForSale && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Metadata
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="landscape, nature, sunset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="wedding">Wedding</option>
                <option value="event">Event</option>
                <option value="commercial">Commercial</option>
                <option value="nature">Nature</option>
                <option value="wildlife">Wildlife Photography</option>
                <option value="street">Street Photography</option>
                <option value="architecture">Architecture</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Where was this photo taken?"
              />
            </div>
          </div>

          {/* Artwork Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Artwork Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edition Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.editionNumber}
                  onChange={(e) => handleInputChange('editionNumber', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Editions
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalEditions}
                  onChange={(e) => handleInputChange('totalEditions', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medium
              </label>
              <input
                type="text"
                value={formData.medium}
                onChange={(e) => handleInputChange('medium', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Photogram, Silver Gelatin Print"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technique
              </label>
              <input
                type="text"
                value={formData.technique}
                onChange={(e) => handleInputChange('technique', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Traditional Photogram Process"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materials
              </label>
              <input
                type="text"
                value={formData.materials}
                onChange={(e) => handleInputChange('materials', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Silver Gelatin Print on Fiber Paper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate ID
              </label>
              <input
                type="text"
                value={formData.certificateId}
                onChange={(e) => handleInputChange('certificateId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unique certificate identifier"
              />
            </div>
          </div>

          {/* Artist Statement & Provenance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Artist Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist Statement
              </label>
              <textarea
                value={formData.artistStatement}
                onChange={(e) => handleInputChange('artistStatement', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the artistic vision and concept behind this work..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provenance
              </label>
              <textarea
                value={formData.provenance}
                onChange={(e) => handleInputChange('provenance', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="History of ownership and exhibition record..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}