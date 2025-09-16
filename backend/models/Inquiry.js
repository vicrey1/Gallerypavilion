const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  // Reference information
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: [true, 'Photo is required']
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
  shareLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShareLink',
    default: null
  },
  
  // Client information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters']
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  clientPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  clientCompany: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  
  // Inquiry details
  inquiryType: {
    type: String,
    required: [true, 'Inquiry type is required'],
    enum: ['purchase', 'license', 'print', 'commission', 'general', 'other']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Photo/artwork details at time of inquiry
  artworkDetails: {
    title: {
      type: String,
      required: [true, 'Artwork title is required']
    },
    edition: String,
    price: Number,
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'USD'
    },
    materials: String,
    dimensions: String
  },
  
  // Request details
  requestedUse: {
    type: String,
    maxlength: [300, 'Requested use cannot exceed 300 characters']
  },
  budget: {
    min: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      default: 'USD'
    },
    isFlexible: {
      type: Boolean,
      default: false
    }
  },
  timeline: {
    type: String,
    maxlength: [200, 'Timeline cannot exceed 200 characters']
  },
  
  // Status and workflow
  status: {
    type: String,
    enum: ['new', 'viewed', 'responded', 'negotiating', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Response tracking
  photographerResponse: {
    message: {
      type: String,
      maxlength: [2000, 'Response message cannot exceed 2000 characters']
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Follow-up information
  followUps: [{
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Follow-up message cannot exceed 1000 characters']
    },
    sentBy: {
      type: String,
      enum: ['client', 'photographer'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['email', 'phone', 'platform'],
      default: 'email'
    }
  }],
  
  // Technical information
  source: {
    ip: String,
    userAgent: String,
    referrer: String,
    location: {
      country: String,
      city: String,
      region: String
    }
  },
  
  // Email tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  emailError: String,
  
  // Notes and tags
  internalNotes: {
    type: String,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Timestamps for workflow
  viewedAt: Date,
  respondedAt: Date,
  completedAt: Date,
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
inquirySchema.index({ photographer: 1, createdAt: -1 });
inquirySchema.index({ gallery: 1, createdAt: -1 });
inquirySchema.index({ photo: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ priority: 1, createdAt: -1 });
inquirySchema.index({ clientEmail: 1 });
inquirySchema.index({ inquiryType: 1 });
inquirySchema.index({ isDeleted: 1 });
inquirySchema.index({ emailSent: 1 });
inquirySchema.index({ subject: 'text', message: 'text', clientName: 'text' });

// Virtual for response time
inquirySchema.virtual('responseTime').get(function() {
  if (!this.respondedAt) return null;
  
  const diffMs = this.respondedAt - this.createdAt;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours} hours`;
  } else {
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days`;
  }
});

// Virtual for age
inquirySchema.virtual('age').get(function() {
  const diffMs = new Date() - this.createdAt;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
  }
});

// Virtual for budget range
inquirySchema.virtual('budgetRange').get(function() {
  if (!this.budget.min && !this.budget.max) return null;
  
  const currency = this.budget.currency || 'USD';
  const symbol = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$'
  }[currency] || currency;
  
  if (this.budget.min && this.budget.max) {
    return `${symbol}${this.budget.min} - ${symbol}${this.budget.max}`;
  } else if (this.budget.min) {
    return `${symbol}${this.budget.min}+`;
  } else {
    return `Up to ${symbol}${this.budget.max}`;
  }
});

// Pre-save middleware
inquirySchema.pre('save', function(next) {
  // Update status timestamps
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'viewed':
        if (!this.viewedAt) this.viewedAt = now;
        break;
      case 'responded':
        if (!this.respondedAt) this.respondedAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
    }
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

// Post-save middleware to update related models
inquirySchema.post('save', async function(doc) {
  try {
    // Update photo inquiry count
    const Photo = mongoose.model('Photo');
    await Photo.findByIdAndUpdate(doc.photo, {
      $inc: { 'stats.inquiries': 1 }
    });
    
    // Update gallery inquiry count
    const Gallery = mongoose.model('Gallery');
    await Gallery.findByIdAndUpdate(doc.gallery, {
      $inc: { 'stats.totalInquiries': 1 }
    });
    
    // Update share link inquiry count if applicable
    if (doc.shareLink) {
      const ShareLink = mongoose.model('ShareLink');
      await ShareLink.findByIdAndUpdate(doc.shareLink, {
        $inc: { 'stats.totalInquiries': 1 }
      });
    }
  } catch (error) {
    console.error('Error updating inquiry counts:', error);
  }
});

// Instance methods
inquirySchema.methods.markAsViewed = function() {
  if (this.status === 'new') {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
  return this.save();
};

inquirySchema.methods.respond = function(message, respondedBy) {
  this.status = 'responded';
  this.respondedAt = new Date();
  this.photographerResponse = {
    message,
    respondedAt: new Date(),
    respondedBy
  };
  return this.save();
};

inquirySchema.methods.addFollowUp = function(message, sentBy, method = 'email') {
  this.followUps.push({
    message,
    sentBy,
    sentAt: new Date(),
    method
  });
  return this.save();
};

inquirySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

inquirySchema.methods.setPriority = function(priority) {
  this.priority = priority;
  return this.save();
};

inquirySchema.methods.addInternalNote = function(note) {
  this.internalNotes = note;
  return this.save();
};

inquirySchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.emailError = null;
  return this.save();
};

inquirySchema.methods.markEmailFailed = function(error) {
  this.emailSent = false;
  this.emailError = error;
  return this.save();
};

inquirySchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

inquirySchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Static methods
inquirySchema.statics.findByPhotographer = function(photographerId, includeDeleted = false) {
  const query = { photographer: photographerId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query)
    .populate('photo', 'title')
    .populate('gallery', 'title')
    .sort({ createdAt: -1 });
};

inquirySchema.statics.findByGallery = function(galleryId, includeDeleted = false) {
  const query = { gallery: galleryId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query)
    .populate('photo', 'title')
    .sort({ createdAt: -1 });
};

inquirySchema.statics.findByPhoto = function(photoId, includeDeleted = false) {
  const query = { photo: photoId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

inquirySchema.statics.findByStatus = function(status, limit = null) {
  const query = this.find({ 
    status, 
    isDeleted: false 
  }).sort({ createdAt: -1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query;
};

inquirySchema.statics.findPending = function() {
  return this.find({
    status: { $in: ['new', 'viewed'] },
    isDeleted: false
  }).sort({ priority: -1, createdAt: 1 });
};

inquirySchema.statics.findHighPriority = function() {
  return this.find({
    priority: { $in: ['high', 'urgent'] },
    status: { $in: ['new', 'viewed', 'responded', 'negotiating'] },
    isDeleted: false
  }).sort({ priority: -1, createdAt: 1 });
};

inquirySchema.statics.getStatsByPhotographer = function(photographerId) {
  return this.aggregate([
    { $match: { photographer: mongoose.Types.ObjectId(photographerId), isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

inquirySchema.statics.searchInquiries = function(searchTerm, limit = 20) {
  return this.find({
    $text: { $search: searchTerm },
    isDeleted: false
  })
  .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
  .limit(limit)
  .populate('photo', 'title')
  .populate('gallery', 'title')
  .populate('photographer', 'firstName lastName');
};

module.exports = mongoose.model('Inquiry', inquirySchema);