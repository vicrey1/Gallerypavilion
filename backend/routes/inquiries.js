const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Inquiry = require('../models/Inquiry');
const Gallery = require('../models/Gallery');
const ShareLink = require('../models/ShareLink');
const { 
  authenticateToken, 
  requireApprovedPhotographer, 
  requireAdmin,
  optionalAuth 
} = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateInquiryCreation = [
  body('type')
    .isIn(['general', 'booking', 'print_order', 'licensing', 'collaboration'])
    .withMessage('Invalid inquiry type'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('clientInfo.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('clientInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('clientInfo.phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
  body('clientInfo.company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  body('galleryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid gallery ID'),
  body('shareToken')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Invalid share token'),
  body('eventDetails.eventDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid event date'),
  body('eventDetails.eventType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Event type must not exceed 100 characters'),
  body('eventDetails.location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('eventDetails.duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters'),
  body('eventDetails.guestCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Guest count must be a positive integer'),
  body('budget.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('budget.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency')
];

const validateInquiryUpdate = [
  body('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'in_progress', 'completed', 'archived'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
  body('internalNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Internal notes must not exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const validateInquiryResponse = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Response message must be between 1 and 2000 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const validateInquiryId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid inquiry ID')
];

// POST /api/inquiries - Create new inquiry (public endpoint)
router.post('/',
  optionalAuth,
  validateInquiryCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiryData = {
        ...req.body,
        technicalInfo: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        }
      };

      // If gallery ID is provided, verify it exists and get photographer
      if (req.body.galleryId) {
        const gallery = await Gallery.findById(req.body.galleryId);
        if (!gallery || gallery.isDeleted) {
          return res.status(404).json({ message: 'Gallery not found' });
        }
        inquiryData.photographer = gallery.photographer;
        inquiryData.referenceInfo.galleryId = req.body.galleryId;
      }

      // If share token is provided, verify it and get gallery/photographer
      if (req.body.shareToken) {
        const shareLink = await ShareLink.findOne({
          token: req.body.shareToken,
          isDeleted: false
        }).populate('gallery');
        
        if (!shareLink) {
          return res.status(404).json({ message: 'Invalid share link' });
        }
        
        inquiryData.photographer = shareLink.photographer;
        inquiryData.referenceInfo.galleryId = shareLink.gallery._id;
        inquiryData.referenceInfo.shareToken = req.body.shareToken;
      }

      const inquiry = new Inquiry(inquiryData);
      await inquiry.save();

      // Populate photographer info for response
      await inquiry.populate('photographer', 'firstName lastName email');

      res.status(201).json({
        message: 'Inquiry submitted successfully',
        inquiry: {
          _id: inquiry._id,
          referenceNumber: inquiry.referenceNumber,
          type: inquiry.type,
          subject: inquiry.subject,
          status: inquiry.status,
          createdAt: inquiry.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating inquiry:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/inquiries - Get inquiries (for photographers and admins)
router.get('/',
  authenticateToken,
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
      .isIn(['new', 'read', 'replied', 'in_progress', 'completed', 'archived'])
      .withMessage('Invalid status'),
    query('type')
      .optional()
      .isIn(['general', 'booking', 'print_order', 'licensing', 'collaboration'])
      .withMessage('Invalid type'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
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
      const { status, type, priority, search } = req.query;

      // Build query based on user role
      let query = { isDeleted: false };
      
      if (req.user.role === 'admin') {
        // Admins can see all inquiries
      } else if (req.user.role === 'photographer') {
        // Photographers can only see their own inquiries
        query.photographer = req.user._id;
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (status) query.status = status;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (search) {
        query.$or = [
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
          { 'clientInfo.name': { $regex: search, $options: 'i' } },
          { 'clientInfo.email': { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const [inquiries, total] = await Promise.all([
        Inquiry.find(query)
          .populate('photographer', 'firstName lastName')
          .populate('assignedTo', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Inquiry.countDocuments(query)
      ]);

      res.json({
        inquiries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/inquiries/:id - Get specific inquiry
router.get('/:id',
  authenticateToken,
  validateInquiryId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiry = await Inquiry.findById(req.params.id)
        .populate('photographer', 'firstName lastName email profilePicture')
        .populate('assignedTo', 'firstName lastName email')
        .populate('referenceInfo.galleryId', 'title')
        .lean();

      if (!inquiry || inquiry.isDeleted) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Check access permissions
      const isOwner = inquiry.photographer._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      const isAssigned = inquiry.assignedTo && inquiry.assignedTo._id.toString() === req.user._id.toString();
      
      if (!isOwner && !isAdmin && !isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Mark as read if it's new
      if (inquiry.status === 'new') {
        await Inquiry.findByIdAndUpdate(req.params.id, {
          status: 'read',
          readAt: new Date(),
          readBy: req.user._id
        });
      }

      res.json(inquiry);
    } catch (error) {
      console.error('Error fetching inquiry:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/inquiries/:id - Update inquiry
router.put('/:id',
  authenticateToken,
  validateInquiryId,
  validateInquiryUpdate,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry || inquiry.isDeleted) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Check access permissions
      const isOwner = inquiry.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      const isAssigned = inquiry.assignedTo && inquiry.assignedTo.toString() === req.user._id.toString();
      
      if (!isOwner && !isAdmin && !isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedInquiry = await Inquiry.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('photographer', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName');

      res.json(updatedInquiry);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/inquiries/:id/respond - Add response to inquiry
router.post('/:id/respond',
  authenticateToken,
  validateInquiryId,
  validateInquiryResponse,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry || inquiry.isDeleted) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Check access permissions
      const isOwner = inquiry.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      const isAssigned = inquiry.assignedTo && inquiry.assignedTo.toString() === req.user._id.toString();
      
      if (!isOwner && !isAdmin && !isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const response = {
        message: req.body.message,
        respondedBy: req.user._id,
        respondedAt: new Date(),
        isPublic: req.body.isPublic !== false // Default to true
      };

      const updatedInquiry = await Inquiry.findByIdAndUpdate(
        req.params.id,
        {
          $push: { responses: response },
          status: 'replied',
          lastResponseAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      )
        .populate('photographer', 'firstName lastName')
        .populate('responses.respondedBy', 'firstName lastName');

      res.json({
        message: 'Response added successfully',
        inquiry: updatedInquiry
      });
    } catch (error) {
      console.error('Error adding response:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/inquiries/:id - Soft delete inquiry
router.delete('/:id',
  authenticateToken,
  validateInquiryId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry || inquiry.isDeleted) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Check access permissions (only owner or admin can delete)
      const isOwner = inquiry.photographer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await Inquiry.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      });

      res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/inquiries/stats/summary - Get inquiry statistics
router.get('/stats/summary',
  authenticateToken,
  async (req, res) => {
    try {
      let query = { isDeleted: false };
      
      if (req.user.role === 'photographer') {
        query.photographer = req.user._id;
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const [totalInquiries, newInquiries, inProgressInquiries, completedInquiries] = await Promise.all([
        Inquiry.countDocuments(query),
        Inquiry.countDocuments({ ...query, status: 'new' }),
        Inquiry.countDocuments({ ...query, status: 'in_progress' }),
        Inquiry.countDocuments({ ...query, status: 'completed' })
      ]);

      // Get inquiries by type
      const inquiriesByType = await Inquiry.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      // Get recent inquiries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentInquiries = await Inquiry.countDocuments({
        ...query,
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        total: totalInquiries,
        new: newInquiries,
        inProgress: inProgressInquiries,
        completed: completedInquiries,
        recent: recentInquiries,
        byType: inquiriesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Error fetching inquiry stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/inquiries/reference/:referenceNumber - Get inquiry by reference number (public)
router.get('/reference/:referenceNumber',
  [
    param('referenceNumber')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Invalid reference number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiry = await Inquiry.findOne({
        referenceNumber: req.params.referenceNumber,
        isDeleted: false
      })
        .populate('photographer', 'firstName lastName')
        .populate('responses.respondedBy', 'firstName lastName')
        .lean();

      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Only return public information and public responses
      const publicInquiry = {
        _id: inquiry._id,
        referenceNumber: inquiry.referenceNumber,
        type: inquiry.type,
        subject: inquiry.subject,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
        photographer: inquiry.photographer,
        responses: inquiry.responses.filter(response => response.isPublic)
      };

      res.json(publicInquiry);
    } catch (error) {
      console.error('Error fetching inquiry by reference:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;