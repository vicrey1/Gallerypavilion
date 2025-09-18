const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { body, param, query, validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const Gallery = require('../models/Gallery');
const { 
  authenticateToken, 
  requireApprovedPhotographer, 
  requireOwnershipOrAdmin,
  optionalAuth 
} = require('../middleware/auth');
const { isCloudStorageConfigured, getFileUrl } = require('../utils/cloudStorage');
const { isGridFSAvailable, getFromGridFS, getPhotoBucket } = require('../utils/gridfsStorage');
const { isCloudinaryConfigured, getOptimizedUrl } = require('../utils/cloudinaryStorage');

const router = express.Router();

// Validation middleware
const validatePhotoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid photo ID')
];

const validatePhotoUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  // Artwork information validation
  body('artwork.isForSale')
    .optional()
    .isBoolean()
    .withMessage('isForSale must be a boolean'),
  body('artwork.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('artwork.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('artwork.year')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() + 10 })
    .withMessage('Year must be between 1800 and current year + 10'),
  body('artwork.series')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Series name cannot exceed 100 characters'),
  body('artwork.edition')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Edition info cannot exceed 100 characters'),
  body('artwork.authenticity')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Authenticity info cannot exceed 200 characters'),
  body('artwork.materials')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Materials info cannot exceed 200 characters'),
  body('artwork.dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Physical dimensions cannot exceed 100 characters'),
  body('artwork.signature')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Signature info cannot exceed 100 characters'),
  body('artwork.medium')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Medium cannot exceed 100 characters'),
  body('artwork.condition')
    .optional()
    .isIn(['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition value'),
  body('artwork.rarity')
    .optional()
    .isIn(['Unique', 'Rare', 'Scarce', 'Common'])
    .withMessage('Invalid rarity value'),
  body('artwork.certificate')
    .optional()
    .isBoolean()
    .withMessage('Certificate must be a boolean'),
  body('artwork.frame')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Frame info cannot exceed 100 characters'),
  body('artwork.context')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Context cannot exceed 500 characters'),
  
  // Artist information validation
  body('artist.biography')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Biography cannot exceed 1000 characters'),
  body('artist.yearsActive')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Years active cannot exceed 50 characters'),
  body('artist.achievements.highAuctionRecord')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('High auction record cannot exceed 100 characters'),
  body('artist.achievements.status')
    .optional()
    .isIn(['Emerging', 'Established', 'Blue-chip'])
    .withMessage('Invalid artist status'),
  body('artist.museums')
    .optional()
    .isArray()
    .withMessage('Museums must be an array'),
  body('artist.museums.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Museum name cannot exceed 100 characters'),
  body('artist.exhibitions')
    .optional()
    .isArray()
    .withMessage('Exhibitions must be an array'),
  body('artist.exhibitions.*.year')
    .optional()
    .isInt({ min: 1800 })
    .withMessage('Exhibition year must be after 1800'),
  body('artist.exhibitions.*.title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Exhibition title cannot exceed 200 characters'),
  body('artist.exhibitions.*.venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Exhibition venue cannot exceed 200 characters'),
  
  // Legacy artwork validation for backward compatibility
  body('artworkInfo.isForSale')
    .optional()
    .isBoolean()
    .withMessage('isForSale must be a boolean'),
  body('artworkInfo.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('artworkInfo.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('artworkInfo.printSizes')
    .optional()
    .isArray()
    .withMessage('Print sizes must be an array'),
  body('displaySettings.showExif')
    .optional()
    .isBoolean()
    .withMessage('showExif must be a boolean'),
  body('displaySettings.allowDownload')
    .optional()
    .isBoolean()
    .withMessage('allowDownload must be a boolean'),
  body('displaySettings.watermarkPosition')
    .optional()
    .isIn(['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'])
    .withMessage('Invalid watermark position')
];

const validateBulkUpdate = [
  body('photoIds')
    .isArray({ min: 1 })
    .withMessage('photoIds must be a non-empty array'),
  body('photoIds.*')
    .isMongoId()
    .withMessage('Each photo ID must be valid'),
  body('updates')
    .isObject()
    .withMessage('Updates must be an object')
];

// GET /api/photos/:id - Get specific photo
router.get('/:id',
  optionalAuth,
  validatePhotoId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id)
        .populate('gallery', 'title isPublished photographer')
        .populate('photographer', 'firstName lastName profilePicture')
        .lean();

      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check access permissions
      const isOwner = req.user && photo.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!photo.gallery.isPublished && photo.isVisible;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Increment view count if not owner
      if (!isOwner) {
        await Photo.findByIdAndUpdate(req.params.id, {
          $inc: { 'stats.views': 1 }
        });
      }

      res.json(photo);
    } catch (error) {
      console.error('Error fetching photo:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/photos/:id - Update photo
router.put('/:id',
  authenticateToken,
  validatePhotoId,
  validatePhotoUpdate,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id).populate('gallery');
      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check ownership
      const isOwner = photo.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedPhoto = await Photo.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('gallery', 'title')
        .populate('photographer', 'firstName lastName');

      res.json(updatedPhoto);
    } catch (error) {
      console.error('Error updating photo:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/photos/:id - Soft delete photo
router.delete('/:id',
  authenticateToken,
  validatePhotoId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id);
      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check ownership
      const isOwner = photo.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await Photo.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      });

      // Update gallery photo count
      await Gallery.findByIdAndUpdate(photo.gallery, {
        $inc: { 'stats.photoCount': -1 }
      });

      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/photos/bulk-update - Bulk update photos
router.post('/bulk-update',
  authenticateToken,
  requireApprovedPhotographer,
  validateBulkUpdate,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { photoIds, updates } = req.body;

      // Verify all photos belong to the user
      const photos = await Photo.find({
        _id: { $in: photoIds },
        photographer: req.user._id,
        isDeleted: false
      });

      if (photos.length !== photoIds.length) {
        return res.status(403).json({ message: 'Some photos not found or access denied' });
      }

      const result = await Photo.updateMany(
        {
          _id: { $in: photoIds },
          photographer: req.user._id,
          isDeleted: false
        },
        { ...updates, updatedAt: new Date() }
      );

      res.json({
        message: `${result.modifiedCount} photos updated successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error bulk updating photos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/photos/reorder - Reorder photos in gallery
router.post('/reorder',
  authenticateToken,
  requireApprovedPhotographer,
  [
    body('galleryId')
      .isMongoId()
      .withMessage('Invalid gallery ID'),
    body('photoOrders')
      .isArray({ min: 1 })
      .withMessage('photoOrders must be a non-empty array'),
    body('photoOrders.*.photoId')
      .isMongoId()
      .withMessage('Each photo ID must be valid'),
    body('photoOrders.*.order')
      .isInt({ min: 0 })
      .withMessage('Order must be a non-negative integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { galleryId, photoOrders } = req.body;

      // Verify gallery ownership
      const gallery = await Gallery.findById(galleryId);
      if (!gallery || gallery.isDeleted) {
        return res.status(404).json({ message: 'Gallery not found' });
      }

      const isOwner = gallery.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Verify all photos belong to the gallery and user
      const photoIds = photoOrders.map(po => po.photoId);
      const photos = await Photo.find({
        _id: { $in: photoIds },
        gallery: galleryId,
        photographer: req.user._id,
        isDeleted: false
      });

      if (photos.length !== photoIds.length) {
        return res.status(403).json({ message: 'Some photos not found or access denied' });
      }

      // Update photo orders
      const bulkOps = photoOrders.map(({ photoId, order }) => ({
        updateOne: {
          filter: { _id: photoId },
          update: { sortOrder: order, updatedAt: new Date() }
        }
      }));

      await Photo.bulkWrite(bulkOps);

      res.json({ message: 'Photos reordered successfully' });
    } catch (error) {
      console.error('Error reordering photos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/photos/:id/download - Download original photo
router.get('/:id/download',
  optionalAuth,
  validatePhotoId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id)
        .populate('gallery', 'isPublished photographer settings')
        .populate('photographer', '_id')
        .lean();

      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check access permissions
      const isOwner = req.user && photo.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!photo.gallery.isPublished && photo.isVisible;
      const allowDownloads = photo.gallery.settings?.allowDownload && photo.displaySettings.allowDownload;

      if (!isOwner && !isAdmin && (!isPublic || !allowDownloads)) {
        return res.status(403).json({ message: 'Download not allowed' });
      }

      // Handle Cloudinary storage first
      if (isCloudinaryConfigured() && photo.storageType === 'cloudinary') {
        try {
          // For Cloudinary, redirect to the original URL
          const downloadUrl = photo.cloudinary?.originalUrl;
          if (!downloadUrl) {
            return res.status(404).json({ message: 'Photo file not found in Cloudinary' });
          }
          
          // Increment download count if not owner
          if (!isOwner) {
            await Photo.findByIdAndUpdate(req.params.id, {
              $inc: { 'stats.downloads': 1 }
            });
          }
          
          return res.redirect(downloadUrl);
        } catch (cloudinaryError) {
          console.error('Cloudinary download error:', cloudinaryError);
          return res.status(404).json({ message: 'Photo file not found in Cloudinary' });
        }
      }
      
      // Handle GridFS storage
      if (isGridFSAvailable()) {
        try {
          const filename = photo.originalKey || photo.filename;
          const fileBuffer = await getFromGridFS(filename);
          
          // Increment download count if not owner
          if (!isOwner) {
            await Photo.findByIdAndUpdate(req.params.id, {
              $inc: { 'stats.downloads': 1 }
            });
          }
          
          res.setHeader('Content-Disposition', `attachment; filename="${photo.originalFilename || photo.filename}"`);
          res.setHeader('Content-Type', photo.mimetype);
          res.setHeader('Content-Length', fileBuffer.length);
          return res.send(fileBuffer);
        } catch (gridfsError) {
          console.error('GridFS download error:', gridfsError);
          return res.status(404).json({ message: 'Photo file not found in GridFS' });
        }
      }
      
      // Handle cloud storage vs local storage
      if (isCloudStorageConfigured()) {
        // For cloud storage, redirect to the signed URL
        const fileUrl = await getFileUrl(photo.originalKey || photo.filename);
        if (!fileUrl) {
          return res.status(404).json({ message: 'Photo file not found' });
        }
        
        // Increment download count if not owner
        if (!isOwner) {
          await Photo.findByIdAndUpdate(req.params.id, {
            $inc: { 'stats.downloads': 1 }
          });
        }
        
        return res.redirect(fileUrl);
      } else {
        // Local storage handling
        const filePath = path.join(__dirname, '../uploads/photos', photo.originalKey || photo.filename);
        
        // Check if file exists
        try {
          await fs.access(filePath);
        } catch (fileError) {
          return res.status(404).json({ message: 'Photo file not found' });
        }

        // Increment download count if not owner
        if (!isOwner) {
          await Photo.findByIdAndUpdate(req.params.id, {
            $inc: { 'stats.downloads': 1 }
          });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${photo.originalFilename || photo.filename}"`);
        res.setHeader('Content-Type', photo.mimetype);
        
        // Stream the file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
      }

    } catch (error) {
      console.error('Error downloading photo:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/photos/:id/preview - Get preview image
router.get('/:id/preview',
  optionalAuth,
  validatePhotoId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id)
        .populate('gallery', 'isPublished photographer')
        .populate('photographer', '_id')
        .lean();

      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check access permissions
      const isOwner = req.user && photo.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!photo.gallery.isPublished && photo.isVisible;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Handle Cloudinary storage first
      if (isCloudinaryConfigured() && photo.storageType === 'cloudinary') {
        try {
          // For Cloudinary, use the preview URL or generate optimized URL
          const previewUrl = photo.cloudinary?.previewUrl || 
                           getOptimizedUrl(photo.cloudinary?.publicId, { width: 800, height: 600, crop: 'limit', quality: 'auto' });
          
          if (!previewUrl) {
            return res.status(404).json({ message: 'Preview image not found in Cloudinary' });
          }
          
          return res.redirect(previewUrl);
        } catch (cloudinaryError) {
          console.error('Cloudinary preview error:', cloudinaryError);
          return res.status(404).json({ message: 'Preview image not found in Cloudinary' });
        }
      }
      
      // Handle GridFS storage
      if (isGridFSAvailable()) {
        try {
          const filename = photo.previewKey || photo.originalKey || photo.filename;
          const fileBuffer = await getFromGridFS(filename);
          
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
          res.setHeader('Content-Length', fileBuffer.length);
          return res.send(fileBuffer);
        } catch (gridfsError) {
          console.error('GridFS preview error:', gridfsError);
          return res.status(404).json({ message: 'Preview image not found in GridFS' });
        }
      }
      
      // Handle cloud storage vs local storage
      if (isCloudStorageConfigured()) {
        // For cloud storage, redirect to the signed URL
        const previewKey = photo.previewKey || photo.originalKey || photo.filename;
        const fileUrl = await getFileUrl(previewKey);
        if (!fileUrl) {
          return res.status(404).json({ message: 'Preview image not found' });
        }
        
        return res.redirect(fileUrl);
      } else {
        // Local storage handling
        const previewKey = photo.previewKey || photo.originalKey || photo.filename;
        const previewPath = path.join(__dirname, '../uploads/photos', previewKey);

        // Check if file exists
        try {
          await fs.access(previewPath);
        } catch (fileError) {
          return res.status(404).json({ message: 'Preview image not found' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        
        // Stream the file
        const fileStream = require('fs').createReadStream(previewPath);
        fileStream.pipe(res);
      }

    } catch (error) {
      console.error('Error serving preview:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/photos/:id/thumbnail - Get thumbnail image
router.get('/:id/thumbnail',
  optionalAuth,
  validatePhotoId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const photo = await Photo.findById(req.params.id)
        .populate('gallery', 'isPublished photographer')
        .populate('photographer', '_id')
        .lean();

      if (!photo || photo.isDeleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Check access permissions
      const isOwner = req.user && photo.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPublic = !!photo.gallery.isPublished && photo.isVisible;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Handle Cloudinary storage first
      if (isCloudinaryConfigured() && photo.storageType === 'cloudinary') {
        try {
          // For Cloudinary, use the thumbnail URL or generate optimized URL
          const thumbnailUrl = photo.cloudinary?.thumbnailUrl || 
                             getOptimizedUrl(photo.cloudinary?.publicId, { width: 300, height: 300, crop: 'fill', quality: 'auto' });
          
          if (!thumbnailUrl) {
            return res.status(404).json({ message: 'Thumbnail image not found in Cloudinary' });
          }
          
          return res.redirect(thumbnailUrl);
        } catch (cloudinaryError) {
          console.error('Cloudinary thumbnail error:', cloudinaryError);
          return res.status(404).json({ message: 'Thumbnail image not found in Cloudinary' });
        }
      }
      
      // Handle GridFS storage
      if (isGridFSAvailable()) {
        try {
          const filename = photo.thumbnailKey || photo.previewKey || photo.originalKey || photo.filename;
          const fileBuffer = await getFromGridFS(filename);
          
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
          res.setHeader('Content-Length', fileBuffer.length);
          return res.send(fileBuffer);
        } catch (gridfsError) {
          console.error('GridFS thumbnail error:', gridfsError);
          return res.status(404).json({ message: 'Thumbnail image not found in GridFS' });
        }
      }
      
      // Handle cloud storage vs local storage
      if (isCloudStorageConfigured()) {
        // For cloud storage, redirect to the signed URL
        const thumbnailKey = photo.thumbnailKey || photo.previewKey || photo.originalKey || photo.filename;
        const fileUrl = await getFileUrl(thumbnailKey);
        if (!fileUrl) {
          return res.status(404).json({ message: 'Thumbnail image not found' });
        }
        
        return res.redirect(fileUrl);
      } else {
        // Local storage handling
        const thumbnailKey = photo.thumbnailKey || photo.previewKey || photo.originalKey || photo.filename;
        const thumbnailPath = path.join(__dirname, '../uploads/photos', thumbnailKey);

        // Check if file exists
        try {
          await fs.access(thumbnailPath);
        } catch (fileError) {
          return res.status(404).json({ message: 'Thumbnail image not found' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        
        // Stream the file
        const fileStream = require('fs').createReadStream(thumbnailPath);
        fileStream.pipe(res);
      }

    } catch (error) {
      console.error('Error serving thumbnail:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;