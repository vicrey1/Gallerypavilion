const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const ShareLink = require('../models/ShareLink');
const Gallery = require('../models/Gallery');
const Photo = require('../models/Photo');
const { 
  authenticateToken, 
  requireApprovedPhotographer, 
  requireOwnershipOrAdmin,
  optionalAuth 
} = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateShareLinkCreation = [
  body('galleryId')
    .isMongoId()
    .withMessage('Invalid gallery ID'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date'),
  body('maxViews')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max views must be a positive integer'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4 and 50 characters'),
  body('allowDownloads')
    .optional()
    .isBoolean()
    .withMessage('allowDownloads must be a boolean'),
  body('showExif')
    .optional()
    .isBoolean()
    .withMessage('showExif must be a boolean'),
  body('watermarkEnabled')
    .optional()
    .isBoolean()
    .withMessage('watermarkEnabled must be a boolean'),
  body('clientName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('clientEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const validateShareLinkUpdate = [
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date'),
  body('maxViews')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max views must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('allowDownloads')
    .optional()
    .isBoolean()
    .withMessage('allowDownloads must be a boolean'),
  body('showExif')
    .optional()
    .isBoolean()
    .withMessage('showExif must be a boolean'),
  body('watermarkEnabled')
    .optional()
    .isBoolean()
    .withMessage('watermarkEnabled must be a boolean'),
  body('clientName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('clientEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const validateToken = [
  param('token')
    .isLength({ min: 1 })
    .withMessage('Invalid token')
];

const validatePasswordAccess = [
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// POST /api/share/create - Create new share link
router.post('/create',
  authenticateToken,
  requireApprovedPhotographer,
  validateShareLinkCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { galleryId, ...shareData } = req.body;

      // Verify gallery ownership
      const gallery = await Gallery.findById(galleryId);
      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const shareLink = new ShareLink({
        gallery: galleryId,
        photographer: req.user._id,
        ...shareData
      });

      await shareLink.save();
      await shareLink.populate('gallery', 'title');

      res.status(201).json(shareLink);
    } catch (error) {
      console.error('Error creating share link:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/share/gallery/:galleryId - Get share links for gallery
router.get('/gallery/:galleryId',
  authenticateToken,
  requireApprovedPhotographer,
  [
    param('galleryId')
      .isMongoId()
      .withMessage('Invalid gallery ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify gallery ownership
      const gallery = await Gallery.findById(req.params.galleryId);
      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const shareLinks = await ShareLink.find({
        gallery: req.params.galleryId,
        isDeleted: false
      })
        .populate('gallery', 'title')
        .sort({ createdAt: -1 })
        .lean();

      res.json(shareLinks);
    } catch (error) {
      console.error('Error fetching share links:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/share/my - Get current user's share links
router.get('/my',
  authenticateToken,
  requireApprovedPhotographer,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('status')
      .optional()
      .isIn(['active', 'expired', 'disabled'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      let query = {
        photographer: req.user._id,
        isDeleted: false
      };

      // Filter by status
      if (status === 'active') {
        query.isActive = true;
        query.$or = [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ];
      } else if (status === 'expired') {
        query.expiresAt = { $lte: new Date() };
      } else if (status === 'disabled') {
        query.isActive = false;
      }

      const [shareLinks, total] = await Promise.all([
        ShareLink.find(query)
          .populate('gallery', 'title')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ShareLink.countDocuments(query)
      ]);

      res.json({
        shareLinks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching user share links:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/share/:token - Access shared gallery by token
router.get('/:token',
  optionalAuth,
  validateToken,
  async (req, res) => {
    try {
      // Skip validation result check for GET route with token param
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   return res.status(400).json({ errors: errors.array() });
      // }

      const shareLink = await ShareLink.findOne({
        token: req.params.token,
        isDeleted: false
      })
        .select('+password') // Include password field for comparison
        .populate('gallery', 'title description category photographer')
        .populate('photographer', 'firstName lastName email profilePicture bio website');

      if (!shareLink) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      // Check if share link is valid
      const isValid = shareLink.isValidAccess();
      if (!isValid) {
        return res.status(403).json({ message: 'Share link is expired or inactive' });
      }

      // Check if gallery is invite-only
      if (shareLink.gallery.settings && shareLink.gallery.settings.inviteOnly) {
        // For invite-only galleries, check if there's a valid invitation code
        const invitationCode = req.query.invite || req.headers['x-invitation-code'];
        
        if (!invitationCode) {
          return res.status(403).json({ 
            message: 'This gallery is invite-only. An invitation code is required.',
            requiresInvitation: true
          });
        }
        
        // Validate invitation code
        const Invitation = require('../models/Invitation');
        const invitation = await Invitation.findValidByCode(invitationCode);
        
        if (!invitation || invitation.gallery._id.toString() !== shareLink.gallery._id.toString()) {
          return res.status(403).json({ 
            message: 'Invalid or expired invitation code.',
            requiresInvitation: true
          });
        }
        
        if (!invitation.canBeUsed()) {
          return res.status(403).json({ 
            message: 'Invitation code is no longer valid.',
            requiresInvitation: true
          });
        }
        
        // Record invitation usage
        await invitation.recordUsage(req.ip, req.get('User-Agent'));
      }

      // Check if password is required
      if (shareLink.hasPassword) {
        // Check if password was provided in query params (for backward compatibility)
        const providedPassword = req.query.password;
        
        if (!providedPassword) {
          return res.status(401).json({ 
            message: 'Password required',
            requiresPassword: true
          });
        }
        
        // Verify the provided password
        const isValidPassword = await shareLink.comparePassword(providedPassword);
        
        if (!isValidPassword) {
          return res.status(401).json({ 
            message: 'Invalid password',
            requiresPassword: true
          });
        }
      }

      // Record access
      const clientInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };

      await shareLink.recordAccess(clientInfo);

      // Get gallery photos
      const photos = await Photo.find({
        gallery: shareLink.gallery._id,
        isDeleted: false,
        $or: [
          { isVisible: true },
          { isVisible: { $exists: false } }
        ]
      })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();

      const mappedPhotos = photos.map(photo => ({
        ...photo,
        previewUrl: photo.previewKey ? `/uploads/photos/${photo.previewKey}` : (photo.filename ? `/uploads/photos/${photo.filename}` : undefined),
        thumbnailUrl: photo.thumbnailKey ? `/uploads/photos/${photo.thumbnailKey}` : (photo.previewKey ? `/uploads/photos/${photo.previewKey}` : undefined),
        url: photo.originalKey ? `/uploads/photos/${photo.originalKey}` : (photo.filename ? `/uploads/photos/${photo.filename}` : undefined),
        // Normalized metadata for frontend display (keep in sync with public gallery route)
        metadata: {
          description: photo.description || '',
          artworkInfo: {
            medium: photo.artwork?.materials || null,
            dimensions: photo.artwork?.dimensions || null,
            year: photo.artwork?.year || (photo.exif?.dateTaken ? new Date(photo.exif.dateTaken).getFullYear() : null),
            series: photo.artwork?.series || null,
            edition: photo.artwork?.edition || null,
            artist: shareLink?.photographer ? `${shareLink.photographer.firstName || ''} ${shareLink.photographer.lastName || ''}`.trim() : null
          },
          purchaseInfo: {
            price: typeof photo.artwork?.price === 'number' ? photo.artwork.price : null,
            currency: photo.artwork?.currency || 'USD',
            available: !!photo.artwork?.isForSale,
            edition: photo.artwork?.edition || null,
            priceOnRequest: !photo.artwork?.price && !!photo.artwork?.isForSale
          }
        },
        // Flattened EXIF data for UI helpers
        exifData: {
          camera: [photo.exif?.camera?.make, photo.exif?.camera?.model].filter(Boolean).join(' ') || null,
          lens: [photo.exif?.lens?.make, photo.exif?.lens?.model].filter(Boolean).join(' ') || null,
          fNumber: photo.exif?.settings?.aperture || null,
          exposureTime: photo.exif?.settings?.shutterSpeed || null,
          iso: photo.exif?.settings?.iso || null,
          focalLength: photo.exif?.lens?.focalLength || null,
          dateTaken: photo.exif?.dateTaken || null,
          location: photo.exif?.location || null
        }
      }));

      res.json({
        gallery: shareLink.gallery,
        photographer: shareLink.photographer,
        photos: mappedPhotos,
        permissions: {
          allowDownloads: shareLink.permissions.allowDownloads,
          showExif: shareLink.permissions.showExif,
          watermarkEnabled: shareLink.permissions.watermarkEnabled
        },
        clientInfo: {
          clientName: shareLink.clientInfo.clientName,
          notes: shareLink.clientInfo.notes
        }
      });
    } catch (error) {
      console.error('Error accessing shared gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/share/:token/verify-password - Verify password for protected share link
router.post('/:token/verify-password',
  validateToken,
  validatePasswordAccess,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shareLink = await ShareLink.findOne({
        token: req.params.token,
        isDeleted: false
      }).select('+password'); // Include password field for comparison

      if (!shareLink) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      if (!shareLink.hasPassword) {
        return res.status(400).json({ message: 'This share link is not password protected' });
      }

      const isValidPassword = await shareLink.comparePassword(req.body.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      res.json({ 
        message: 'Password verified',
        verified: true
      });
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/share/:id - Update share link
router.put('/:id',
  authenticateToken,
  requireApprovedPhotographer,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid share link ID')
  ],
  validateShareLinkUpdate,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shareLink = await ShareLink.findById(req.params.id);
      if (!shareLink || shareLink.isDeleted) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      // Check ownership
      const isOwner = shareLink.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedShareLink = await ShareLink.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('gallery', 'title');

      res.json(updatedShareLink);
    } catch (error) {
      console.error('Error updating share link:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/share/:id - Delete share link
router.delete('/:id',
  authenticateToken,
  requireApprovedPhotographer,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid share link ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shareLink = await ShareLink.findById(req.params.id);
      if (!shareLink || shareLink.isDeleted) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      // Check ownership
      const isOwner = shareLink.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await ShareLink.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      });

      res.json({ message: 'Share link deleted successfully' });
    } catch (error) {
      console.error('Error deleting share link:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/share/:token/stats - Get share link statistics
router.get('/:token/stats',
  authenticateToken,
  requireApprovedPhotographer,
  validateToken,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shareLink = await ShareLink.findOne({
        token: req.params.token,
        photographer: req.user._id,
        isDeleted: false
      }).lean();

      if (!shareLink) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      const stats = {
        totalViews: shareLink.stats.totalViews,
        uniqueViews: shareLink.stats.uniqueViews,
        lastAccessed: shareLink.stats.lastAccessed,
        recentAccess: shareLink.recentAccess.slice(-10), // Last 10 accesses
        isActive: shareLink.isActive,
        isExpired: shareLink.expiresAt && shareLink.expiresAt <= new Date(),
        viewsRemaining: shareLink.maxViews ? shareLink.maxViews - shareLink.stats.totalViews : null
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching share link stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;