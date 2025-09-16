const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    index: true,
    required: true
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
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter is required']
  },
  // Invitation details
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  recipientName: {
    type: String,
    trim: true,
    maxlength: [100, 'Recipient name cannot exceed 100 characters']
  },

  // Access control
  expiresAt: {
    type: Date,
    default: function() {
      // Default to 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  maxUses: {
    type: Number,
    default: 1,
    min: [1, 'Max uses must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Usage tracking
  stats: {
    totalUses: {
      type: Number,
      default: 0
    },
    firstUsedAt: {
      type: Date,
      default: null
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  // Access log
  usageLog: [{
    ip: String,
    userAgent: String,
    usedAt: {
      type: Date,
      default: Date.now
    },
    location: {
      country: String,
      city: String,
      region: String
    }
  }],
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
invitationSchema.index({ code: 1 }, { unique: true });
invitationSchema.index({ gallery: 1, createdAt: -1 });
invitationSchema.index({ photographer: 1, createdAt: -1 });
invitationSchema.index({ recipientEmail: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ isActive: 1, isDeleted: 1 });

// Virtual for expired status
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for usage exhausted status
invitationSchema.virtual('isExhausted').get(function() {
  return this.maxUses && this.stats.totalUses >= this.maxUses;
});

// Virtual for valid status
invitationSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isDeleted && !this.isExpired && !this.isExhausted;
});

// Virtual for full invitation URL
invitationSchema.virtual('fullUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/gallery/invite/${this.code}`;
});

// Virtual for days until expiry
invitationSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Pre-save middleware to generate unique code
invitationSchema.pre('save', async function(next) {
  console.log('Pre-save middleware running, isNew:', this.isNew, 'current code:', this.code);
  
  if (this.isNew && !this.code) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Generate a random 8-character code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      console.log('Generated code attempt', attempts + 1, ':', code);
      
      // Check if code already exists
      const existingInvitation = await this.constructor.findOne({ code });
      
      if (!existingInvitation) {
        this.code = code;
        console.log('Code set successfully:', this.code);
        break;
      }
      
      attempts++;
    }
    
    if (!this.code) {
      console.error('Failed to generate unique code after', maxAttempts, 'attempts');
      return next(new Error('Failed to generate unique invitation code'));
    }
  }
  
  console.log('Pre-save middleware completed, final code:', this.code);
  next();
});

// Instance method to record usage
invitationSchema.methods.recordUsage = function(ip, userAgent, location = {}) {
  this.stats.totalUses += 1;
  this.stats.lastUsedAt = new Date();
  
  if (!this.stats.firstUsedAt) {
    this.stats.firstUsedAt = new Date();
  }
  
  this.usageLog.push({
    ip,
    userAgent,
    usedAt: new Date(),
    location
  });
  
  // Keep only last 50 usage logs
  if (this.usageLog.length > 50) {
    this.usageLog = this.usageLog.slice(-50);
  }
  
  return this.save();
};

// Instance method to check if invitation can be used
invitationSchema.methods.canBeUsed = function() {
  return this.isValid;
};

// Static method to find valid invitation by code
invitationSchema.statics.findValidByCode = function(code) {
  return this.findOne({
    code,
    isActive: true,
    isDeleted: false,
    expiresAt: { $gt: new Date() }
  }).populate('gallery photographer');
};

// Static method to create invitation with auto-generated code
invitationSchema.statics.createInvitation = async function(data) {
  const invitation = new this(data);
  return invitation.save();
};

module.exports = mongoose.model('Invitation', invitationSchema);