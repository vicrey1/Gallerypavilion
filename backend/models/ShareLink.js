const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const shareLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    unique: true,
    index: true
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
  name: {
    type: String,
    required: [true, 'Share link name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters'],
    default: ''
  },
  // Access control
  password: {
    type: String,
    default: null,
    select: false // Don't include password in queries by default
  },
  hasPassword: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  maxViews: {
    type: Number,
    default: null,
    min: [1, 'Max views must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Access permissions
  permissions: {
    allowDownloads: {
      type: Boolean,
      default: false
    },
    showExif: {
      type: Boolean,
      default: false
    },
    watermarkEnabled: {
      type: Boolean,
      default: false
    },
    allowFullscreen: {
      type: Boolean,
      default: true
    },
    showPricing: {
      type: Boolean,
      default: true
    },
    allowInquiries: {
      type: Boolean,
      default: true
    }
  },
  // Usage statistics
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    totalInquiries: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: null
    },
    firstAccessedAt: {
      type: Date,
      default: null
    }
  },
  // Access log (store recent accesses)
  recentAccesses: [{
    ip: String,
    userAgent: String,
    accessedAt: {
      type: Date,
      default: Date.now
    },
    location: {
      country: String,
      city: String,
      region: String
    }
  }],
  // Client information (optional)
  clientInfo: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
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
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
shareLinkSchema.index({ token: 1 }, { unique: true });
shareLinkSchema.index({ gallery: 1, createdAt: -1 });
shareLinkSchema.index({ photographer: 1, createdAt: -1 });
shareLinkSchema.index({ expiresAt: 1 });
shareLinkSchema.index({ isActive: 1, isDeleted: 1 });
shareLinkSchema.index({ 'stats.totalViews': -1 });

// Virtual for expired status
shareLinkSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for full URL
shareLinkSchema.virtual('fullUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/gallery/${this.token}`;
});

// Virtual for days until expiry
shareLinkSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Pre-save middleware
shareLinkSchema.pre('save', async function(next) {
  // Generate unique token if not provided
  if (!this.token) {
    this.token = await this.constructor.generateUniqueToken();
  }
  
  // Hash password if provided and modified
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.hasPassword = true;
  } else if (!this.password) {
    this.hasPassword = false;
  }
  
  // Limit recent accesses to last 100 entries
  if (this.recentAccesses && this.recentAccesses.length > 100) {
    this.recentAccesses = this.recentAccesses.slice(-100);
  }
  
  next();
});

// Instance methods
shareLinkSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return true; // No password required
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

shareLinkSchema.methods.isValidAccess = function() {
  // Check if link is active
  if (!this.isActive || this.isDeleted) {
    return { valid: false, reason: 'Link is inactive or deleted' };
  }
  
  // Check if expired
  if (this.isExpired) {
    return { valid: false, reason: 'Link has expired' };
  }
  
  return { valid: true };
};

shareLinkSchema.methods.recordAccess = function(accessInfo = {}) {
  const now = new Date();
  
  // Update stats
  this.stats.totalViews += 1;
  this.stats.lastAccessedAt = now;
  
  if (!this.stats.firstAccessedAt) {
    this.stats.firstAccessedAt = now;
  }
  
  // Add to recent accesses
  const access = {
    ip: accessInfo.ip,
    userAgent: accessInfo.userAgent,
    accessedAt: now,
    location: accessInfo.location || {}
  };
  
  this.recentAccesses.push(access);
  
  // Check if this is a unique view (same IP within 24 hours)
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const recentFromSameIP = this.recentAccesses.filter(acc => 
    acc.ip === accessInfo.ip && acc.accessedAt > oneDayAgo
  );
  
  if (recentFromSameIP.length === 1) { // First access from this IP in 24h
    this.stats.uniqueViews += 1;
  }
  
  return this.save();
};

shareLinkSchema.methods.incrementInquiries = function() {
  this.stats.totalInquiries += 1;
  return this.save();
};

shareLinkSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isActive = false;
  return this.save();
};

shareLinkSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.isActive = true;
  return this.save();
};

shareLinkSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

shareLinkSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

shareLinkSchema.methods.extendExpiry = function(days) {
  if (days && days > 0) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    this.expiresAt = newExpiry;
  } else {
    this.expiresAt = null; // Remove expiry
  }
  return this.save();
};

// Static methods
shareLinkSchema.statics.generateUniqueToken = async function() {
  let token;
  let exists = true;
  
  while (exists) {
    // Generate cryptographically secure random token
    token = crypto.randomBytes(32).toString('hex');
    
    // Check if token already exists
    const existing = await this.findOne({ token });
    exists = !!existing;
  }
  
  return token;
};

shareLinkSchema.statics.findByToken = function(token) {
  return this.findOne({ 
    token, 
    isDeleted: false 
  }).populate('gallery').populate('photographer', 'firstName lastName email');
};

shareLinkSchema.statics.findByGallery = function(galleryId, includeDeleted = false) {
  const query = { gallery: galleryId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ createdAt: -1 });
};

shareLinkSchema.statics.findByPhotographer = function(photographerId, includeDeleted = false) {
  const query = { photographer: photographerId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query)
    .populate('gallery', 'title')
    .sort({ createdAt: -1 });
};

shareLinkSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    isActive: true,
    isDeleted: false
  });
};

shareLinkSchema.statics.findActive = function() {
  return this.find({
    isActive: true,
    isDeleted: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

shareLinkSchema.statics.getPopular = function(limit = 10) {
  return this.find({
    isActive: true,
    isDeleted: false,
    'stats.totalViews': { $gt: 0 }
  })
  .sort({ 'stats.totalViews': -1, createdAt: -1 })
  .limit(limit)
  .populate('gallery', 'title')
  .populate('photographer', 'firstName lastName');
};

// Cleanup expired links (can be run as a cron job)
shareLinkSchema.statics.deactivateExpired = async function() {
  const result = await this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true,
      isDeleted: false
    },
    {
      $set: { isActive: false }
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('ShareLink', shareLinkSchema);