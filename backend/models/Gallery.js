const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Gallery title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Gallery description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Gallery category is required'],
    enum: ['Portrait', 'Wedding', 'Landscape', 'Wildlife', 'Street', 'Fashion', 'Commercial', 'Fine Art', 'Event', 'Documentary']
  },
  collections: [{
    type: String,
    trim: true,
    maxlength: [50, 'Collection name cannot exceed 50 characters']
  }],
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Photographer is required']
  },
  photographerBio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Photographer biography cannot exceed 2000 characters'],
    default: ''
  },
  coverImage: {
    originalKey: String,
    previewKey: String,
    thumbnailKey: String,
    url: String,
    filename: String,
    size: Number,
    mimetype: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  unpublishedAt: {
    type: Date,
    default: null
  },
  settings: {
    allowDownload: {
      type: Boolean,
      default: false
    },
    showMetadata: {
      type: Boolean,
      default: true
    },
    enableComments: {
      type: Boolean,
      default: false
    },
    watermarkIntensity: {
      type: String,
      enum: ['light', 'medium', 'heavy'],
      default: 'medium'
    },
    sortOrder: {
      type: String,
      enum: ['newest', 'oldest', 'custom'],
      default: 'newest'
    },
    inviteOnly: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalPhotos: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalShares: {
      type: Number,
      default: 0
    },
    totalInquiries: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: null
    }
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  pricing: {
    isForSale: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'USD'
    },
    basePrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    priceNote: {
      type: String,
      maxlength: [200, 'Price note cannot exceed 200 characters']
    }
  },
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
gallerySchema.index({ photographer: 1, createdAt: -1 });
gallerySchema.index({ isPublished: 1, createdAt: -1 });
gallerySchema.index({ category: 1, isPublished: 1 });
gallerySchema.index({ 'stats.totalViews': -1 });
gallerySchema.index({ isDeleted: 1 });
gallerySchema.index({ title: 'text', description: 'text' });

// Virtual for photo count
gallerySchema.virtual('photoCount', {
  ref: 'Photo',
  localField: '_id',
  foreignField: 'gallery',
  count: true
});

// Virtual for share links count
gallerySchema.virtual('shareLinksCount', {
  ref: 'ShareLink',
  localField: '_id',
  foreignField: 'gallery',
  count: true
});

// Pre-save middleware
gallerySchema.pre('save', function(next) {
  // Set published/unpublished timestamps
  if (this.isModified('isPublished')) {
    if (this.isPublished) {
      this.publishedAt = new Date();
      this.unpublishedAt = null;
    } else {
      this.unpublishedAt = new Date();
    }
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle && this.title) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.seo.metaDescription && this.description) {
    this.seo.metaDescription = this.description.substring(0, 160);
  }
  
  next();
});

// Instance methods
gallerySchema.methods.incrementViews = function() {
  return this.updateOne({
    $inc: { 'stats.totalViews': 1 },
    $set: { 'stats.lastViewedAt': new Date() }
  });
};

gallerySchema.methods.incrementShares = function() {
  return this.updateOne({
    $inc: { 'stats.totalShares': 1 }
  });
};

gallerySchema.methods.incrementInquiries = function() {
  return this.updateOne({
    $inc: { 'stats.totalInquiries': 1 }
  });
};

gallerySchema.methods.updatePhotoCount = async function() {
  const Photo = mongoose.model('Photo');
  const count = await Photo.countDocuments({ 
    gallery: this._id, 
    isDeleted: false 
  });
  
  this.stats.totalPhotos = count;
  return this.save();
};

gallerySchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isPublished = false;
  return this.save();
};

gallerySchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Static methods
gallerySchema.statics.findByPhotographer = function(photographerId, includeDeleted = false) {
  const query = { photographer: photographerId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

gallerySchema.statics.findPublished = function(limit = null) {
  const query = this.find({ 
    isPublished: true, 
    isDeleted: false 
  }).sort({ 'stats.totalViews': -1, createdAt: -1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query;
};

gallerySchema.statics.findByCategory = function(category, limit = null) {
  const query = this.find({ 
    category, 
    isPublished: true, 
    isDeleted: false 
  }).sort({ 'stats.totalViews': -1, createdAt: -1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query;
};

gallerySchema.statics.getPopular = function(limit = 10) {
  return this.find({ 
    isPublished: true, 
    isDeleted: false,
    'stats.totalViews': { $gt: 0 }
  })
  .sort({ 'stats.totalViews': -1, createdAt: -1 })
  .limit(limit)
  .populate('photographer', 'firstName lastName profileImage');
};

gallerySchema.statics.searchGalleries = function(searchTerm, limit = 20) {
  return this.find({
    $text: { $search: searchTerm },
    isPublished: true,
    isDeleted: false
  })
  .sort({ score: { $meta: 'textScore' }, 'stats.totalViews': -1 })
  .limit(limit)
  .populate('photographer', 'firstName lastName profileImage');
};

module.exports = mongoose.model('Gallery', gallerySchema);