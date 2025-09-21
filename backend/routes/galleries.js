const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { body, param, query, validationResult } = require('express-validator');
const Gallery = require('../models/Gallery');
const Photo = require('../models/Photo');
const ShareLink = require('../models/ShareLink');
const { 
  authenticateToken, 
  requireApprovedPhotographer, 
  requireOwnershipOrAdmin,
  optionalAuth 
} = require('../middleware/auth');
const { 
  photoUpload, 
  processUploadedImages, 
  handleUploadErrors, 
  cleanupOnError 
} = require('../middleware/upload');
const { isCloudStorageConfigured } = require('../utils/cloudStorage');
const { isGridFSAvailable } = require('../utils/gridfsStorage');

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/photos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 20 // Max 20 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|tiff|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateGallery = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must not exceed 1000 characters'),
  body('category')
    .isIn(['Portrait', 'Wedding', 'Landscape', 'Wildlife', 'Street', 'Fashion', 'Commercial', 'Fine Art', 'Event', 'Documentary'])
    .withMessage('Category is required and must be valid'),
  // Accept either an object or a JSON string that parses to an object
  body('settings')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Settings must be an object');
          }
        } catch (e) {
          throw new Error('Invalid settings format');
        }
      } else if (value !== null && typeof value !== 'object') {
        throw new Error('Settings must be an object');
      }
      return true;
    }),
  // Accept either an array or a JSON string that parses to an array
  body('collections')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Collections must be an array');
          }
        } catch (e) {
          throw new Error('Invalid collections format');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('Collections must be an array');
      }
      return true;
    })
];

const validateGalleryId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid gallery ID')
];

// GET /api/galleries - Get all galleries (public + user's own)
router.get('/', 
  optionalAuth,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('category')
      .optional()
      .isIn(['wedding', 'portrait', 'landscape', 'event', 'commercial', 'fashion', 'nature', 'street', 'other'])
      .withMessage('Invalid category'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('photographer')
      .optional()
      .isMongoId()
      .withMessage('Invalid photographer ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;
      const { category, search, photographer } = req.query;

      // Build query
      let query = { isDeleted: false };
      
      // If user is not authenticated or not the photographer, only show public galleries
      if (!req.user) {
        query.isPublished = true;
      } else if (req.user.role !== 'ADMIN') {
        query.$or = [
          { isPublished: true },
          { photographer: req.user._id }
        ];
      }

      if (category) query.category = category;
      if (photographer) query.photographer = photographer;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const [galleries, total] = await Promise.all([
        Gallery.find(query)
          .populate('photographer', 'firstName lastName profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Gallery.countDocuments(query)
      ]);

      res.json({
        galleries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching galleries:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/galleries/my - Get current user's galleries
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
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      let query = { 
        photographer: req.user._id,
        isDeleted: false
      };
      
      if (status) query.status = status;

      const [galleries, total] = await Promise.all([
        Gallery.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Gallery.countDocuments(query)
      ]);

      res.json({
        galleries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching user galleries:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);



// GET /api/galleries/stats - Get dashboard statistics
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const userRole = req.user.role;
      const userStatus = req.user.status;

      // Handle different user roles and statuses
      if (userRole === 'ADMIN') {
        // Admin gets system-wide statistics
        const [totalGalleries, publishedGalleries, totalPhotos] = await Promise.all([
          Gallery.countDocuments({ isDeleted: false }),
          Gallery.countDocuments({ isDeleted: false, isPublished: true }),
          require('../models/Photo').countDocuments({ isDeleted: false })
        ]);

        const viewsResult = await Gallery.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: null, totalViews: { $sum: '$stats.views' } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        res.json({
          success: true,
          stats: {
            totalGalleries,
            totalPhotos,
            activeShares: publishedGalleries,
            totalViews
          },
          breakdown: {
            published: publishedGalleries,
            draft: totalGalleries - publishedGalleries
          },
          recentActivity: []
        });
      } else if (userRole === 'PHOTOGRAPHER') {
        if (userStatus !== 'APPROVED') {
          // Pending/rejected photographers get limited stats
          res.json({
            success: true,
            stats: {
              totalGalleries: 0,
              totalPhotos: 0,
              activeShares: 0,
              totalViews: 0
            },
            breakdown: {
              published: 0,
              draft: 0
            },
            recentActivity: [],
            message: userStatus === 'PENDING' ? 'Your account is pending approval' : 'Your account requires approval to access features'
          });
          return;
        }

        // Approved photographers get their own statistics
        const photographerId = userId;

        const [totalGalleries, publishedGalleries, draftGalleries] = await Promise.all([
          Gallery.countDocuments({ photographer: photographerId, isDeleted: false }),
          Gallery.countDocuments({ photographer: photographerId, isDeleted: false, isPublished: true }),
          Gallery.countDocuments({ photographer: photographerId, isDeleted: false, isPublished: false })
        ]);

        const Photo = require('../models/Photo');
        const totalPhotos = await Photo.countDocuments({ photographer: photographerId, isDeleted: false });

        const viewsResult = await Gallery.aggregate([
          { $match: { photographer: photographerId, isDeleted: false } },
          { $group: { _id: null, totalViews: { $sum: '$stats.views' } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        const activeShares = publishedGalleries;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentGalleries = await Gallery.find({
          photographer: photographerId,
          isDeleted: false,
          createdAt: { $gte: thirtyDaysAgo }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt status')
        .lean();

        res.json({
          success: true,
          stats: {
            totalGalleries,
            totalPhotos,
            activeShares,
            totalViews
          },
          breakdown: {
            published: publishedGalleries,
            draft: draftGalleries
          },
          recentActivity: recentGalleries
        });
      } else {
        // Other roles get empty stats
        res.json({
          success: true,
          stats: {
            totalGalleries: 0,
            totalPhotos: 0,
            activeShares: 0,
            totalViews: 0
          },
          breakdown: {
            published: 0,
            draft: 0
          },
          recentActivity: [],
          message: 'Dashboard access limited to photographers and administrators'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/galleries - Create new gallery
router.post('/',
  authenticateToken,
  requireApprovedPhotographer,
  upload.single('coverImage'),
  validateGallery,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors in gallery creation:', errors.array());
        console.log('Request body received:', req.body);
        console.log('Request file received:', req.file);
        return res.status(400).json({ errors: errors.array() });
      }

      // Parse JSON fields from FormData
      const galleryData = {
        ...req.body,
        photographer: req.user._id
      };

      // Parse settings and collections if they exist
      if (req.body.settings) {
        try {
          galleryData.settings = typeof req.body.settings === 'string' ? JSON.parse(req.body.settings) : req.body.settings;
          // Sanitize settings to match schema
          const s = galleryData.settings || {};
          // Map numeric or string numeric watermark to enum
          const toEnum = (n) => (n <= 0.33 ? 'light' : (n <= 0.66 ? 'medium' : 'heavy'));
          if (typeof s.watermarkIntensity === 'number') {
            s.watermarkIntensity = toEnum(s.watermarkIntensity);
          } else if (typeof s.watermarkIntensity === 'string') {
            if (!['light', 'medium', 'heavy'].includes(s.watermarkIntensity)) {
              const num = parseFloat(s.watermarkIntensity);
              s.watermarkIntensity = Number.isFinite(num) ? toEnum(num) : 'medium';
            }
          } else {
            s.watermarkIntensity = 'medium';
          }
          // Enforce allowed keys and defaults
          galleryData.settings = {
            allowDownload: !!s.allowDownload,
            showMetadata: !!s.showMetadata,
            enableComments: !!s.enableComments,
            watermarkIntensity: s.watermarkIntensity,
            sortOrder: ['newest', 'oldest', 'custom'].includes(s.sortOrder) ? s.sortOrder : 'newest',
            inviteOnly: !!s.inviteOnly
          };
        } catch (e) {
          return res.status(400).json({ message: 'Invalid settings format' });
        }
      }

      if (req.body.collections) {
        try {
          const parsed = typeof req.body.collections === 'string' ? JSON.parse(req.body.collections) : req.body.collections;
          if (!Array.isArray(parsed)) {
            return res.status(400).json({ message: 'Collections must be an array' });
          }
          // Trim and filter empty collection names
          galleryData.collections = parsed.map(c => (c || '').toString().trim()).filter(Boolean);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid collections format' });
        }
      }

      // Handle cover image if uploaded
      if (req.file) {
        galleryData.coverImage = {
          originalKey: req.file.filename,
          previewKey: req.file.filename,
          url: `/uploads/photos/${req.file.filename}`, // Will be handled by photo routes
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }

      const gallery = new Gallery(galleryData);
      await gallery.save();
      
      await gallery.populate('photographer', 'firstName lastName profilePicture');

      res.status(201).json({ success: true, gallery });
    } catch (error) {
      console.error('Error creating gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/galleries/:id - Get specific gallery
router.get('/:id',
  optionalAuth,
  validateGalleryId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id)
        .populate('photographer', 'firstName lastName profilePicture bio website socialLinks')
        .lean();

      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check access permissions
      const isOwner = req.user && gallery.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!gallery.isPublished;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Increment view count if not owner
      if (!isOwner) {
        await Gallery.findByIdAndUpdate(req.params.id, {
          $inc: { 'stats.views': 1 }
        });
      }

      res.json(gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/galleries/:id - Update gallery
router.put('/:id',
  authenticateToken,
  requireApprovedPhotographer,
  validateGalleryId,
  upload.single('coverImage'),
  validateGallery,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // First check if gallery exists and user has permission
      const existingGallery = await Gallery.findById(req.params.id);
      if (!existingGallery || existingGallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = existingGallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Build safe update payload
      const updateData = {};

      // Basic fields
      if (typeof req.body.title !== 'undefined') updateData.title = req.body.title;
      if (typeof req.body.description !== 'undefined') updateData.description = req.body.description;
      if (typeof req.body.category !== 'undefined') updateData.category = req.body.category;
      if (typeof req.body.photographerBio !== 'undefined') updateData.photographerBio = req.body.photographerBio;

      // Settings (stringified JSON or object)
      if (typeof req.body.settings !== 'undefined') {
        try {
          const raw = typeof req.body.settings === 'string' ? JSON.parse(req.body.settings) : req.body.settings;
          const s = raw || {};
          const toEnum = (n) => (n <= 0.33 ? 'light' : (n <= 0.66 ? 'medium' : 'heavy'));
          let intensity = s.watermarkIntensity;
          if (typeof intensity === 'number') {
            intensity = toEnum(intensity);
          } else if (typeof intensity === 'string') {
            if (!['light', 'medium', 'heavy'].includes(intensity)) {
              const num = parseFloat(intensity);
              intensity = Number.isFinite(num) ? toEnum(num) : 'medium';
            }
          } else {
            intensity = 'medium';
          }
          updateData.settings = {
            allowDownload: !!s.allowDownload,
            showMetadata: !!s.showMetadata,
            enableComments: !!s.enableComments,
            watermarkIntensity: intensity,
            sortOrder: ['newest', 'oldest', 'custom'].includes(s.sortOrder) ? s.sortOrder : 'newest',
            inviteOnly: !!s.inviteOnly
          };
        } catch (e) {
          return res.status(400).json({ message: 'Invalid settings format' });
        }
      }

      // Collections (stringified JSON or array)
      if (typeof req.body.collections !== 'undefined') {
        try {
          const parsed = typeof req.body.collections === 'string' ? JSON.parse(req.body.collections) : req.body.collections;
          if (!Array.isArray(parsed)) {
            return res.status(400).json({ message: 'Collections must be an array' });
          }
          updateData.collections = parsed.map(c => (c || '').toString().trim()).filter(Boolean);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid collections format' });
        }
      }

      // Handle cover image if uploaded
      if (req.file) {
        updateData.coverImage = {
          originalKey: req.file.filename,
          previewKey: req.file.filename,
          url: `/uploads/photos/${req.file.filename}`, // Will be handled by photo routes
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }

      updateData.updatedAt = new Date();

      const gallery = await Gallery.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('photographer', 'firstName lastName profilePicture');

      res.json(gallery);
    } catch (error) {
      console.error('Error updating gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PATCH /api/galleries/:id/status - Update gallery publish status
router.patch('/:id/status',
  authenticateToken,
  requireApprovedPhotographer,
  validateGalleryId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { isPublished } = req.body;
      
      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({ message: 'isPublished must be a boolean value' });
      }

      // Check if gallery exists and user has permission
      const existingGallery = await Gallery.findById(req.params.id);
      if (!existingGallery || existingGallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = existingGallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update publish status
      const gallery = await Gallery.findByIdAndUpdate(
        req.params.id,
        { 
          isPublished,
          publishedAt: isPublished ? new Date() : existingGallery.publishedAt,
          unpublishedAt: !isPublished ? new Date() : null,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('photographer', 'firstName lastName profilePicture');

      res.json({
        success: true,
        message: `Gallery ${isPublished ? 'published' : 'unpublished'} successfully`,
        gallery
      });
    } catch (error) {
      console.error('Error updating gallery status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/galleries/:id - Soft delete gallery
router.delete('/:id',
  authenticateToken,
  requireApprovedPhotographer,
  validateGalleryId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // First check if gallery exists and user has permission
      const existingGallery = await Gallery.findById(req.params.id);
      if (!existingGallery || existingGallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = existingGallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const gallery = await Gallery.findByIdAndUpdate(
        req.params.id,
        { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user._id
        },
        { new: true }
      );

      if (!gallery) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Also soft delete all photos in this gallery
      await Photo.updateMany(
        { gallery: req.params.id },
        { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user._id
        }
      );

      res.json({ message: 'Gallery deleted successfully' });
    } catch (error) {
      console.error('Error deleting gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/galleries/:id/photos - Upload photos to gallery
router.post('/:id/photos',
  authenticateToken,
  requireApprovedPhotographer,
  validateGalleryId,
  // Add request timeout middleware
  (req, res, next) => {
    // Set a 3-minute timeout for the entire request
    req.setTimeout(180000, () => {
      console.error('Request timeout for photo upload');
      if (!res.headersSent) {
        res.status(504).json({
          message: 'Upload timeout',
          error: 'The upload is taking too long. Please try uploading fewer or smaller images.',
          code: 'REQUEST_TIMEOUT'
        });
      }
    });
    next();
  },
  cleanupOnError,
  photoUpload,
  handleUploadErrors,
  async (req, res, next) => {
    // Get gallery settings for watermark configuration
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery || gallery.isDeleted) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check ownership
    const isOwner = gallery.photographer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Configure image processing based on gallery settings
    
    const processingOptions = {
      createThumbnail: true,
      createPreview: true,
      quality: 85,
      timeout: 120000 // 2 minute processing timeout
    };

    // Apply image processing middleware
    return processUploadedImages(processingOptions)(req, res, next);
  },
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id);
      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No photos uploaded' });
      }

      // Check if image processing was successful
      if (!req.processedFiles || req.processedFiles.length === 0) {
        return res.status(400).json({ message: 'No images were successfully processed' });
      }

      const uploadedPhotos = [];
      const uploadErrors = req.processingErrors || [];

      for (const processedFile of req.processedFiles) {
        try {
          
          // Handle different data structures based on storage type
      const isCloudinary = require('../utils/cloudinaryStorage').isCloudinaryConfigured();
      const isGridFS = isGridFSAvailable();
      const isCloud = isCloudStorageConfigured();
      
      let original, preview, thumbnail, watermarked, originalName, mimetype, size;
      
      if (isCloudinary) {
        // Cloudinary provides processed structure with URLs
        ({ original, preview, thumbnail, watermarked } = processedFile.processed);
        originalName = processedFile.originalname;
        mimetype = processedFile.mimetype;
        size = processedFile.size;
      } else if (isGridFS || isCloud) {
        // GridFS and cloud storage provide direct structure
        ({ original, preview, thumbnail, watermarked } = processedFile);
        originalName = processedFile.originalName;
        mimetype = processedFile.mimetype;
        size = processedFile.size;
      } else {
        // Local storage uses processed structure
        ({ original, preview, thumbnail, watermarked } = processedFile.processed || processedFile);
        originalName = processedFile.originalname;
        mimetype = processedFile.mimetype;
        size = processedFile.size;
      }
      
      const photoData = {
        title: originalName.replace(/\.[^/.]+$/, ''),
        gallery: req.params.id,
        photographer: req.user._id,
        originalFilename: originalName,
        mimetype: mimetype,
        size: size,
      };
      
      // Set storage-specific fields
      if (isCloudinary) {
        photoData.storageType = 'cloudinary';
        photoData.cloudinary = {
          publicId: original.publicId,
          originalUrl: original.url,
          previewUrl: preview ? preview.url : null,
          thumbnailUrl: thumbnail ? thumbnail.url : null,
          watermarkedUrl: watermarked ? watermarked.url : null,
          transformations: {
            preview: preview ? preview.transformation : null,
            thumbnail: thumbnail ? thumbnail.transformation : null,
            watermarked: watermarked ? watermarked.transformation : null
          }
        };
        // For backward compatibility, also set the key fields
        photoData.originalKey = original.publicId;
        photoData.previewKey = original.publicId;
        photoData.thumbnailKey = original.publicId;
        photoData.watermarkedKey = watermarked ? original.publicId : null;
        photoData.filename = original.publicId;
      } else {
        // GridFS, S3, or local storage
        photoData.storageType = isGridFS ? 'gridfs' : (isCloud ? 's3' : 'local');
        photoData.originalKey = isGridFS ? original.filename : (isCloud ? original.key : path.basename(original.path));
        photoData.previewKey = preview ? (isGridFS ? preview.filename : (isCloud ? preview.key : path.basename(preview.path))) : null;
        photoData.thumbnailKey = thumbnail ? (isGridFS ? thumbnail.filename : (isCloud ? thumbnail.key : path.basename(thumbnail.path))) : null;
        photoData.watermarkedKey = watermarked ? (isGridFS ? watermarked.filename : (isCloud ? watermarked.key : path.basename(watermarked.path))) : null;
        photoData.filename = isGridFS ? original.filename : (isCloud ? original.key : path.basename(original.path));
      }
      
      // Set dimensions
       photoData.dimensions = {
         width: original.metadata?.width || original.width || null,
         height: original.metadata?.height || original.height || null,
         aspectRatio: (original.metadata?.width || original.width) && (original.metadata?.height || original.height) ? 
           (original.metadata?.width || original.width) / (original.metadata?.height || original.height) : null
       };
       
       const photo = new Photo(photoData);
       
       // Set EXIF data if available
       if (original.metadata) {
         photo.exif = {
              camera: {
                make: original.metadata?.exif?.Make || null,
                model: original.metadata?.exif?.Model || null
              },
              lens: {
                make: null,
                model: null,
                focalLength: original.metadata?.exif?.FocalLength || null
              },
              settings: {
                aperture: original.metadata?.exif?.FNumber || null,
                shutterSpeed: original.metadata?.exif?.ExposureTime || null,
                iso: original.metadata?.exif?.ISO || null,
                exposureMode: null,
                whiteBalance: null,
                flash: null
              },
              location: {
                latitude: null,
                longitude: null,
                altitude: null,
                city: null,
                country: null
              },
              dateTaken: original.metadata?.exif?.DateTime || null
            };
       }
       
       photo.processingStatus = 'completed';

          await photo.save();
          uploadedPhotos.push(photo);

          // Update gallery photo count
          await Gallery.findByIdAndUpdate(req.params.id, {
            $inc: { 'stats.photoCount': 1 }
          });

        } catch (photoError) {
          console.error(`Error saving photo ${processedFile.original.originalname}:`, photoError);
          uploadErrors.push({
            filename: processedFile.original.originalname,
            error: 'Failed to save photo to database'
          });
        }
      }

      res.status(201).json({
        message: `${uploadedPhotos.length} photos uploaded successfully with watermarks`,
        photos: uploadedPhotos,
        errors: uploadErrors.length > 0 ? uploadErrors : undefined
      });

    } catch (error) {
      console.error('Error uploading photos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/galleries/:id/public - Public access to gallery with photos
router.get('/:id/public',
  optionalAuth,
  validateGalleryId,
  async (req, res) => {
    try {
      const gallery = await Gallery.findById(req.params.id)
        .populate('photographer', 'firstName lastName email profilePicture')
        .lean();

      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Ensure gallery is published for public access
      if (!gallery.isPublished) {
        // Allow owner or admin to preview unpublished gallery
        const isOwner = req.user && gallery.photographer._id.toString() === req.user._id.toString();
        const isAdmin = req.user && req.user.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ message: 'This gallery is not publicly available' });
        }
      }

      // Determine sorting based on gallery settings
      const sortSetting = (gallery.settings && gallery.settings.sortOrder) ? gallery.settings.sortOrder : 'newest';
      let sort;
      switch (sortSetting) {
        case 'oldest':
          sort = { createdAt: 1, _id: 1 };
          break;
        case 'custom':
          sort = { sortOrder: 1, createdAt: 1, _id: 1 };
          break;
        case 'newest':
        default:
          sort = { createdAt: -1, _id: 1 };
          break;
      }

      const photos = await Photo.find({
        gallery: req.params.id,
        isDeleted: false,
        isVisible: true // only publicly visible photos
      })
        .sort(sort)
        .lean();

      // Map URLs similar to share route for consistency
      const mappedPhotos = photos.map(photo => ({
        ...photo,
        previewUrl: `/api/photos/${photo._id}/preview`,
        thumbnailUrl: `/api/photos/${photo._id}/thumbnail`,
        url: `/api/photos/${photo._id}/download`,
        // Normalized metadata for frontend display
        metadata: {
          description: photo.description || '',
          artworkInfo: {
            medium: photo.artwork?.materials || null,
            dimensions: photo.artwork?.dimensions || null,
            year: photo.artwork?.year || (photo.exif?.dateTaken ? new Date(photo.exif.dateTaken).getFullYear() : null),
            series: photo.artwork?.series || null,
            edition: photo.artwork?.edition || null,
            artist: gallery?.photographer ? `${gallery.photographer.firstName || ''} ${gallery.photographer.lastName || ''}`.trim() : null
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
        gallery,
        photos: mappedPhotos
      });
    } catch (error) {
      console.error('Error fetching public gallery:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/galleries/:id/photos - Get photos in gallery
router.get('/:id/photos',
  optionalAuth,
  validateGalleryId,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id);
      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check access permissions
      const isOwner = req.user && gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!gallery.isPublished;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 24;
      const skip = (page - 1) * limit;

      // Determine sorting based on gallery settings
      const sortSetting = (gallery.settings && gallery.settings.sortOrder) ? gallery.settings.sortOrder : 'newest';
      let sort;
      switch (sortSetting) {
        case 'oldest':
          sort = { createdAt: 1, _id: 1 };
          break;
        case 'custom':
          // Use explicit custom order if provided, fallback to createdAt
          sort = { sortOrder: 1, createdAt: 1, _id: 1 };
          break;
        case 'newest':
        default:
          sort = { createdAt: -1, _id: 1 };
          break;
      }

      const [photos, total] = await Promise.all([
        Photo.find({ 
          gallery: req.params.id,
          isDeleted: false
        })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Photo.countDocuments({ 
          gallery: req.params.id,
          isDeleted: false
        })
      ]);

      // Map URLs for frontend consumption
      const mappedPhotos = photos.map(photo => ({
        ...photo,
        previewUrl: `/api/photos/${photo._id}/preview`,
        thumbnailUrl: `/api/photos/${photo._id}/thumbnail`,
        url: `/api/photos/${photo._id}/download`
      }));

      res.json({
        photos: mappedPhotos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get share links for a gallery
router.get('/:id/shares',
  authenticateToken,
  requireApprovedPhotographer,
  param('id').isMongoId().withMessage('Invalid gallery ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id);
      if (!gallery) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const shareLinks = await ShareLink.find({
        gallery: req.params.id,
        isDeleted: false
      }).populate('gallery', 'title');

      res.json({ shares: shareLinks });
    } catch (error) {
      console.error('Error fetching share links:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create a new share link for a gallery
router.post('/:id/shares',
  authenticateToken,
  requireApprovedPhotographer,
  [
    param('id').isMongoId().withMessage('Invalid gallery ID'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('expiresAt').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid expiration date'),
    body('maxViews').optional({ checkFalsy: true }).isInt({ min: 1 }).toInt().withMessage('Max views must be a positive integer'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 4, max: 50 }).withMessage('Password must be between 4 and 50 characters'),
    body('allowDownloads').optional().isBoolean().toBoolean().withMessage('allowDownloads must be a boolean'),
    body('showExif').optional().isBoolean().toBoolean().withMessage('showExif must be a boolean'),
    body('watermarkEnabled').optional().isBoolean().toBoolean().withMessage('watermarkEnabled must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id);
      if (!gallery) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      // Check ownership
      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const {
        name,
        expiresAt,
        maxViews,
        password,
        allowDownloads = false,
        showExif = false,
        watermarkEnabled = false
      } = req.body;

      const shareLink = new ShareLink({
        gallery: req.params.id,
        photographer: req.user._id,
        name,
        expiresAt: expiresAt || null,
        maxViews: typeof maxViews === 'number' ? maxViews : null,
        password: password || null,
        permissions: {
          allowDownloads,
          showExif,
          watermarkEnabled
        }
      });

      await shareLink.save();
      await shareLink.populate('gallery', 'title');

      res.status(201).json({ share: shareLink });
    } catch (error) {
      console.error('Error creating share link:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a share link
router.delete('/:id/shares/:shareId',
  authenticateToken,
  requireApprovedPhotographer,
  [
    param('id').isMongoId().withMessage('Invalid gallery ID'),
    param('shareId').isMongoId().withMessage('Invalid share link ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.findById(req.params.id);
      if (!gallery) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      const shareLink = await ShareLink.findById(req.params.shareId);
      if (!shareLink || shareLink.isDeleted) {
        return res.status(404).json({ message: 'Share link not found' });
      }

      // Check ownership
      const isOwner = shareLink.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await ShareLink.findByIdAndUpdate(req.params.shareId, {
        isDeleted: true,
        deletedAt: new Date()
      });

      res.json({ message: 'Share link deleted successfully' });
    } catch (error) {
      console.error('Error deleting share link:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;