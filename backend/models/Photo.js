const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Photo title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  gallery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery',
    required: [true, 'Gallery is required']
  },
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Photographer is required']
  },
  // File storage information
  originalKey: {
    type: String,
    required: [true, 'Original file key is required']
  },
  previewKey: {
    type: String,
    required: [true, 'Preview file key is required']
  },
  thumbnailKey: {
    type: String,
    required: [true, 'Thumbnail file key is required']
  },
  watermarkedKey: {
    type: String,
    required: false // Optional field for watermarked versions
  },
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalFilename: {
    type: String,
    required: [true, 'Original filename is required']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  // Image dimensions
  dimensions: {
    width: {
      type: Number,
      required: [true, 'Image width is required'],
      min: [1, 'Width must be positive']
    },
    height: {
      type: Number,
      required: [true, 'Image height is required'],
      min: [1, 'Height must be positive']
    },
    aspectRatio: {
      type: Number,
      required: [true, 'Aspect ratio is required']
    }
  },
  // EXIF data
  exif: {
    camera: {
      make: String,
      model: String
    },
    lens: {
      make: String,
      model: String,
      focalLength: String
    },
    settings: {
      aperture: String,
      shutterSpeed: String,
      iso: String,
      exposureMode: String,
      whiteBalance: String,
      flash: String
    },
    location: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
      city: String,
      country: String
    },
    dateTaken: Date,
    software: String,
    copyright: String
  },
  // Artwork metadata for sales
  artwork: {
    isForSale: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'USD'
    },
    year: {
      type: Number,
      min: [1800, 'Year must be after 1800'],
      max: [new Date().getFullYear() + 10, 'Year cannot be too far in the future']
    },
    series: {
      type: String,
      maxlength: [100, 'Series name cannot exceed 100 characters']
    },
    edition: {
      type: String,
      maxlength: [100, 'Edition info cannot exceed 100 characters']
    },
    authenticity: {
      type: String,
      maxlength: [200, 'Authenticity info cannot exceed 200 characters']
    },
    materials: {
      type: String,
      maxlength: [200, 'Materials info cannot exceed 200 characters']
    },
    dimensions: {
      type: String,
      maxlength: [100, 'Physical dimensions cannot exceed 100 characters']
    },
    signature: {
      type: String,
      maxlength: [100, 'Signature info cannot exceed 100 characters']
    },
    medium: {
      type: String,
      maxlength: [100, 'Medium cannot exceed 100 characters']
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      default: 'Excellent'
    },
    rarity: {
      type: String,
      enum: ['Unique', 'Rare', 'Scarce', 'Common'],
      default: 'Common'
    },
    certificate: {
      type: Boolean,
      default: false
    },
    frame: {
      type: String,
      maxlength: [100, 'Frame info cannot exceed 100 characters']
    },
    context: {
      type: String,
      maxlength: [500, 'Context cannot exceed 500 characters']
    },
    purchaseInfo: {
      type: String,
      maxlength: [300, 'Purchase info cannot exceed 300 characters']
    },
    shippingInfo: {
      type: String,
      maxlength: [300, 'Shipping info cannot exceed 300 characters']
    },
    returnPolicy: {
      type: String,
      maxlength: [300, 'Return policy cannot exceed 300 characters']
    },
    provenance: {
      type: String,
      maxlength: [500, 'Provenance cannot exceed 500 characters']
    }
  },
  
  // Artist information
  artist: {
    biography: {
      type: String,
      maxlength: [1000, 'Biography cannot exceed 1000 characters']
    },
    yearsActive: {
      type: String,
      maxlength: [50, 'Years active cannot exceed 50 characters']
    },
    achievements: {
      highAuctionRecord: {
        type: String,
        maxlength: [100, 'High auction record cannot exceed 100 characters']
      },
      status: {
        type: String,
        enum: ['Emerging', 'Established', 'Blue-chip'],
        default: 'Emerging'
      }
    },
    museums: [{
      type: String,
      maxlength: [100, 'Museum name cannot exceed 100 characters']
    }],
    exhibitions: [{
      year: {
        type: Number,
        min: [1800, 'Exhibition year must be after 1800']
      },
      title: {
        type: String,
        maxlength: [200, 'Exhibition title cannot exceed 200 characters']
      },
      venue: {
        type: String,
        maxlength: [200, 'Exhibition venue cannot exceed 200 characters']
      }
    }]
  },
  // Display settings
  sortOrder: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: null
    }
  },
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    default: null
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
photoSchema.index({ gallery: 1, sortOrder: 1 });
photoSchema.index({ photographer: 1, createdAt: -1 });
photoSchema.index({ processingStatus: 1 });
photoSchema.index({ isDeleted: 1 });
photoSchema.index({ 'stats.views': -1 });
photoSchema.index({ tags: 1 });
photoSchema.index({ 'artwork.isForSale': 1 });
photoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for aspect ratio calculation
photoSchema.virtual('aspectRatioString').get(function() {
  if (!this.dimensions.width || !this.dimensions.height) return null;
  
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(this.dimensions.width, this.dimensions.height);
  
  return `${this.dimensions.width / divisor}:${this.dimensions.height / divisor}`;
});

// Virtual for file size in human readable format
photoSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Pre-save middleware
photoSchema.pre('save', function(next) {
  // Calculate aspect ratio
  if (this.dimensions.width && this.dimensions.height) {
    this.dimensions.aspectRatio = this.dimensions.width / this.dimensions.height;
  }
  
  // Clean up tags
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  }
  
  next();
});

// Post-save middleware to update gallery photo count
photoSchema.post('save', async function(doc) {
  try {
    const Gallery = mongoose.model('Gallery');
    await Gallery.findByIdAndUpdate(doc.gallery, {
      $inc: { 'stats.totalPhotos': doc.isDeleted ? -1 : 1 }
    });
  } catch (error) {
    console.error('Error updating gallery photo count:', error);
  }
});

// Instance methods
photoSchema.methods.incrementViews = function() {
  return this.updateOne({
    $inc: { 'stats.views': 1 },
    $set: { 'stats.lastViewedAt': new Date() }
  });
};

photoSchema.methods.incrementLikes = function() {
  return this.updateOne({
    $inc: { 'stats.likes': 1 }
  });
};

photoSchema.methods.incrementInquiries = function() {
  return this.updateOne({
    $inc: { 'stats.inquiries': 1 }
  });
};

photoSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

photoSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

photoSchema.methods.updateProcessingStatus = function(status, error = null) {
  this.processingStatus = status;
  this.processingError = error;
  return this.save();
};

// Static methods
photoSchema.statics.findByGallery = function(galleryId, includeDeleted = false) {
  const query = { gallery: galleryId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ sortOrder: 1, createdAt: 1 });
};

photoSchema.statics.findByPhotographer = function(photographerId, includeDeleted = false) {
  const query = { photographer: photographerId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

photoSchema.statics.findForSale = function(limit = null) {
  const query = this.find({ 
    'artwork.isForSale': true, 
    isDeleted: false,
    processingStatus: 'completed'
  })
  .populate('gallery', 'title isPublished')
  .populate('photographer', 'firstName lastName')
  .sort({ 'stats.views': -1, createdAt: -1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query;
};

photoSchema.statics.findPending = function() {
  return this.find({ 
    processingStatus: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: 1 });
};

photoSchema.statics.findFailed = function() {
  return this.find({ 
    processingStatus: 'failed'
  }).sort({ createdAt: -1 });
};

photoSchema.statics.searchPhotos = function(searchTerm, limit = 20) {
  return this.find({
    $text: { $search: searchTerm },
    isDeleted: false,
    processingStatus: 'completed'
  })
  .sort({ score: { $meta: 'textScore' }, 'stats.views': -1 })
  .limit(limit)
  .populate('gallery', 'title isPublished')
  .populate('photographer', 'firstName lastName');
};

photoSchema.statics.getPopular = function(limit = 10) {
  return this.find({ 
    isDeleted: false,
    processingStatus: 'completed',
    'stats.views': { $gt: 0 }
  })
  .sort({ 'stats.views': -1, createdAt: -1 })
  .limit(limit)
  .populate('gallery', 'title isPublished')
  .populate('photographer', 'firstName lastName');
};

module.exports = mongoose.model('Photo', photoSchema);