'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Tag, MapPin, Image, Award, FileText } from 'lucide-react'

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

  // Artwork Information
  photographerName?: string
  yearCreated?: string
  yearPrinted?: string
  seriesName?: string
  
  // Edition & Authenticity
  editionNumber?: string
  editionSize?: number
  signatureType?: string
  certificateOfAuthenticity?: boolean
  
  // Materials & Size
  medium?: string
  printingTechnique?: string
  paperType?: string
  dimensions?: {
    image?: string
    paper?: string
    framed?: string
  }
  framingOptions?: string[]
  
  // Context
  artistStatement?: string
  exhibitionHistory?: string[]
  
  // Purchase Information
  shippingDetails?: {
    method: string
    timeframe: string
  }
  returnPolicy?: string
}

interface PhotoEditModalProps {
  photo: Photo
  isOpen: boolean
  onClose: () => void
  onSave: (photoData: Partial<Photo>) => Promise<void>
}

export default function PhotoEditModal({ photo, isOpen, onClose, onSave }: PhotoEditModalProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    title: photo.title || '',
    description: photo.description || '',
    price: photo.price || 0,
    isForSale: photo.isForSale,
    tags: photo.tags.join(', '),
    category: photo.category || '',
    location: photo.location || '',

    // Artwork Information
    photographerName: photo.photographerName || '',
    yearCreated: photo.yearCreated || '',
    yearPrinted: photo.yearPrinted || '',
    seriesName: photo.seriesName || '',

    // Edition & Authenticity
    editionNumber: photo.editionNumber || '',
    editionSize: photo.editionSize || 0,
    signatureType: photo.signatureType || '',
    certificateOfAuthenticity: photo.certificateOfAuthenticity || false,

    // Materials & Size
    medium: photo.medium || '',
    printingTechnique: photo.printingTechnique || '',
    paperType: photo.paperType || '',
    dimensions: {
      image: photo.dimensions?.image || '',
      paper: photo.dimensions?.paper || '',
      framed: photo.dimensions?.framed || ''
    },
    framingOptions: photo.framingOptions?.join('\n') || '',

    // Context
    artistStatement: photo.artistStatement || '',
    exhibitionHistory: photo.exhibitionHistory?.join('\n') || '',

    // Purchase Information
    shippingMethod: photo.shippingDetails?.method || '',
    shippingTimeframe: photo.shippingDetails?.timeframe || '',
    returnPolicy: photo.returnPolicy || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        // Basic Information
        title: photo.title || '',
        description: photo.description || '',
        price: photo.price || 0,
        isForSale: photo.isForSale,
        tags: photo.tags.join(', '),
        category: photo.category || '',
        location: photo.location || '',

        // Artwork Information
        photographerName: photo.photographerName || '',
        yearCreated: photo.yearCreated || '',
        yearPrinted: photo.yearPrinted || '',
        seriesName: photo.seriesName || '',

        // Edition & Authenticity
        editionNumber: photo.editionNumber || '',
        editionSize: photo.editionSize || 0,
        signatureType: photo.signatureType || '',
        certificateOfAuthenticity: photo.certificateOfAuthenticity || false,

        // Materials & Size
        medium: photo.medium || '',
        printingTechnique: photo.printingTechnique || '',
        paperType: photo.paperType || '',
        dimensions: {
          image: photo.dimensions?.image || '',
          paper: photo.dimensions?.paper || '',
          framed: photo.dimensions?.framed || ''
        },
        framingOptions: photo.framingOptions?.join('\n') || '',

        // Context
        artistStatement: photo.artistStatement || '',
        exhibitionHistory: photo.exhibitionHistory?.join('\n') || '',

        // Purchase Information
        shippingMethod: photo.shippingDetails?.method || '',
        shippingTimeframe: photo.shippingDetails?.timeframe || '',
        returnPolicy: photo.returnPolicy || ''
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

  const handleDimensionChange = (dimensionField: 'image' | 'paper' | 'framed', value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimensionField]: value
      }
    }))
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
        // Basic Information
        title: formData.title,
        description: formData.description,
        price: formData.price,
        isForSale: formData.isForSale,
        tags: tagsArray,
        category: formData.category,
        location: formData.location,

        // Artwork Information
        photographerName: formData.photographerName,
        yearCreated: formData.yearCreated,
        yearPrinted: formData.yearPrinted,
        seriesName: formData.seriesName,

        // Edition & Authenticity
        editionNumber: formData.editionNumber,
        editionSize: formData.editionSize,
        signatureType: formData.signatureType,
        certificateOfAuthenticity: formData.certificateOfAuthenticity,

        // Materials & Size
        medium: formData.medium,
        printingTechnique: formData.printingTechnique,
        paperType: formData.paperType,
        dimensions: {
          image: formData.dimensions.image,
          paper: formData.dimensions.paper,
          framed: formData.dimensions.framed
        },
        framingOptions: formData.framingOptions.split('\n').filter(option => option.trim()),

        // Context
        artistStatement: formData.artistStatement,
        exhibitionHistory: formData.exhibitionHistory.split('\n').filter(entry => entry.trim()),

        // Purchase Information
        shippingDetails: {
          method: formData.shippingMethod,
          timeframe: formData.shippingTimeframe
        },
        returnPolicy: formData.returnPolicy
      })
      // Close modal before fetch to ensure we get fresh data
      onClose()
      // Wait a moment for the save to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      // Force a gallery refresh by reloading the page
      window.location.reload()
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
            <img
              src={photo.thumbnailUrl}
              alt={photo.title || 'Photo'}
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
              <Image className="w-5 h-5 mr-2" />
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

          {/* Artwork Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Artwork Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photographer's Name
                </label>
                <input
                  type="text"
                  value={formData.photographerName}
                  onChange={(e) => handleInputChange('photographerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name of the photographer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Series/Collection Name
                </label>
                <input
                  type="text"
                  value={formData.seriesName}
                  onChange={(e) => handleInputChange('seriesName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name of the series if applicable"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Created
                </label>
                <input
                  type="text"
                  value={formData.yearCreated}
                  onChange={(e) => handleInputChange('yearCreated', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="YYYY"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Printed
                </label>
                <input
                  type="text"
                  value={formData.yearPrinted}
                  onChange={(e) => handleInputChange('yearPrinted', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="YYYY (if different)"
                />
              </div>
            </div>
          </div>

          {/* Edition & Authenticity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Edition & Authenticity
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edition Number
                </label>
                <input
                  type="text"
                  value={formData.editionNumber}
                  onChange={(e) => handleInputChange('editionNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3/12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edition Size
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.editionSize}
                  onChange={(e) => handleInputChange('editionSize', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Total number in edition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signature Type
              </label>
              <input
                type="text"
                value={formData.signatureType}
                onChange={(e) => handleInputChange('signatureType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hand-signed, Embossed, Digital signature"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="certificateOfAuthenticity"
                checked={formData.certificateOfAuthenticity}
                onChange={(e) => handleInputChange('certificateOfAuthenticity', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="certificateOfAuthenticity" className="text-sm font-medium text-gray-700">
                Certificate of Authenticity Included
              </label>
            </div>
          </div>

          {/* Materials & Size */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Materials & Size
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medium
              </label>
              <input
                type="text"
                value={formData.medium}
                onChange={(e) => handleInputChange('medium', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Archival pigment print"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Printing Technique
              </label>
              <input
                type="text"
                value={formData.printingTechnique}
                onChange={(e) => handleInputChange('printingTechnique', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Darkroom, Inkjet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paper Type
              </label>
              <input
                type="text"
                value={formData.paperType}
                onChange={(e) => handleInputChange('paperType', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Image Size</label>
                  <input
                    type="text"
                    value={formData.dimensions.image}
                    onChange={(e) => handleDimensionChange('image', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 16 x 20 in"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Paper Size</label>
                  <input
                    type="text"
                    value={formData.dimensions.paper}
                    onChange={(e) => handleDimensionChange('paper', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 20 x 24 in"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Framed Size</label>
                  <input
                    type="text"
                    value={formData.dimensions.framed}
                    onChange={(e) => handleDimensionChange('framed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 22 x 26 in"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Framing Options
              </label>
              <textarea
                value={formData.framingOptions}
                onChange={(e) => handleInputChange('framingOptions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each framing option on a new line"
              />
            </div>
          </div>

          {/* Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Context & History
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
                placeholder="Brief background or concept of the artwork..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exhibition History
              </label>
              <textarea
                value={formData.exhibitionHistory}
                onChange={(e) => handleInputChange('exhibitionHistory', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each exhibition/publication on a new line"
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Purchase Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Method
              </label>
              <input
                type="text"
                value={formData.shippingMethod}
                onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Professional art shipping, Tube, Crate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Timeframe
              </label>
              <input
                type="text"
                value={formData.shippingTimeframe}
                onChange={(e) => handleInputChange('shippingTimeframe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2-3 weeks for framed works"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Policy
              </label>
              <textarea
                value={formData.returnPolicy}
                onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed return policy information..."
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