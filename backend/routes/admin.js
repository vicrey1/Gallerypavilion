const express = require('express');
const User = require('../models/User');
const Gallery = require('../models/Gallery');
const Photo = require('../models/Photo');
const ShareLink = require('../models/ShareLink');
const Inquiry = require('../models/Inquiry');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/pending
// @desc    Get pending photographer applications
// @access  Admin
router.get('/pending', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const pendingUsers = await User.find({
      role: 'PHOTOGRAPHER',
      status: 'PENDING'
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-password');
    
    const total = await User.countDocuments({
      role: 'PHOTOGRAPHER',
      status: 'PENDING'
    });
    
    res.json({
      success: true,
      data: {
        users: pendingUsers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting pending applications'
    });
  }
});

// @route   POST /api/admin/approve/:userId
// @desc    Approve a photographer
// @access  Admin
router.post('/approve/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'PHOTOGRAPHER') {
      return res.status(400).json({
        success: false,
        message: 'User is not a photographer'
      });
    }
    
    if (user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }
    
    // Update user status
    user.status = 'APPROVED';
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    user.rejectedAt = null;
    user.rejectedBy = null;
    user.rejectionReason = '';
    
    await user.save();
    
    // TODO: Send approval email to photographer
    
    res.json({
      success: true,
      message: 'Photographer approved successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        approvedAt: user.approvedAt
      }
    });
    
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving photographer'
    });
  }
});

// @route   POST /api/admin/reject/:userId
// @desc    Reject a photographer
// @access  Admin
router.post('/reject/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'PHOTOGRAPHER') {
      return res.status(400).json({
        success: false,
        message: 'User is not a photographer'
      });
    }
    
    if (user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }
    
    // Update user status
    user.status = 'REJECTED';
    user.rejectedAt = new Date();
    user.rejectedBy = req.user._id;
    user.rejectionReason = reason.trim();
    user.approvedAt = null;
    user.approvedBy = null;
    
    await user.save();
    
    // TODO: Send rejection email to photographer
    
    res.json({
      success: true,
      message: 'Photographer rejected successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.rejectionReason
      }
    });
    
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting photographer'
    });
  }
});

// @route   GET /api/admin/photographers
// @desc    Get all photographers
// @access  Admin
router.get('/photographers', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Build query
    const query = { role: 'PHOTOGRAPHER' };
    
    if (status) {
      query.status = status.toUpperCase();
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const photographers = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName');
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        photographers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get photographers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting photographers'
    });
  }
});

// @route   GET /api/admin/galleries
// @desc    Get all galleries
// @access  Admin
router.get('/galleries', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isPublished, 
      category,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Build query
    const query = { isDeleted: false };
    
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const galleries = await Gallery.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('photographer', 'firstName lastName email status')
      .select('-__v');
    
    const total = await Gallery.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        galleries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get galleries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting galleries'
    });
  }
});

// @route   PATCH /api/admin/galleries/:galleryId/status
// @desc    Update gallery publish status (admin)
// @access  Admin
router.patch('/galleries/:galleryId/status', async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { isPublished, reason } = req.body;
    
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublished must be a boolean value'
      });
    }
    
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }
    
    gallery.isPublished = isPublished;
    if (isPublished) {
      gallery.publishedAt = new Date();
      gallery.unpublishedAt = null;
    } else {
      gallery.unpublishedAt = new Date();
    }
    
    await gallery.save();
    
    // TODO: Notify photographer about status change
    
    res.json({
      success: true,
      message: `Gallery ${isPublished ? 'published' : 'unpublished'} successfully`,
      gallery: {
        id: gallery._id,
        title: gallery.title,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
        unpublishedAt: gallery.unpublishedAt
      }
    });
    
  } catch (error) {
    console.error('Update gallery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating gallery status'
    });
  }
});

// @route   DELETE /api/admin/galleries/:galleryId
// @desc    Delete a gallery
// @access  Admin
router.delete('/galleries/:galleryId', async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { reason } = req.body;
    
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }
    
    // Soft delete
    await gallery.softDelete(req.user._id);
    
    // TODO: Notify photographer about deletion
    
    res.json({
      success: true,
      message: 'Gallery deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting gallery'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Admin
router.get('/analytics', async (req, res) => {
  try {
    // Get basic counts
    const [userStats, galleryStats, photoStats, inquiryStats] = await Promise.all([
      User.aggregate([
        { $match: { role: 'PHOTOGRAPHER' } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Gallery.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$isPublished',
            count: { $sum: 1 }
          }
        }
      ]),
      Photo.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      Inquiry.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentSignups, recentGalleries, recentPhotos, recentInquiries] = await Promise.all([
      User.countDocuments({
        role: 'PHOTOGRAPHER',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Gallery.countDocuments({
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Photo.countDocuments({
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Inquiry.countDocuments({
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo }
      })
    ]);
    
    // Get top photographers by gallery count
    const topPhotographers = await Gallery.aggregate([
      { $match: { isDeleted: false, isPublished: true } },
      {
        $group: {
          _id: '$photographer',
          galleryCount: { $sum: 1 },
          totalViews: { $sum: '$stats.totalViews' }
        }
      },
      { $sort: { galleryCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'photographer'
        }
      },
      { $unwind: '$photographer' },
      {
        $project: {
          _id: 1,
          galleryCount: 1,
          totalViews: 1,
          'photographer.firstName': 1,
          'photographer.lastName': 1,
          'photographer.email': 1
        }
      }
    ]);
    
    // Format user stats
    const userStatsFormatted = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    userStats.forEach(stat => {
      userStatsFormatted[stat._id.toLowerCase()] = stat.count;
    });
    
    // Format gallery stats
    const galleryStatsFormatted = {
      published: 0,
      unpublished: 0
    };
    
    galleryStats.forEach(stat => {
      galleryStatsFormatted[stat._id ? 'published' : 'unpublished'] = stat.count;
    });
    
    // Format photo stats
    const photoStatsFormatted = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    photoStats.forEach(stat => {
      photoStatsFormatted[stat._id] = stat.count;
    });
    
    // Format inquiry stats
    const inquiryStatsFormatted = {
      new: 0,
      viewed: 0,
      responded: 0,
      completed: 0
    };
    
    inquiryStats.forEach(stat => {
      inquiryStatsFormatted[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          photographers: userStatsFormatted,
          galleries: galleryStatsFormatted,
          photos: photoStatsFormatted,
          inquiries: inquiryStatsFormatted
        },
        recentActivity: {
          signups: recentSignups,
          galleries: recentGalleries,
          photos: recentPhotos,
          inquiries: recentInquiries
        },
        topPhotographers
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting analytics'
    });
  }
});

// @route   GET /api/admin/inquiries
// @desc    Get all inquiries
// @access  Admin
router.get('/inquiries', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Build query
    const query = { isDeleted: false };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    const inquiries = await Inquiry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('photographer', 'firstName lastName email')
      .populate('gallery', 'title')
      .populate('photo', 'title')
      .select('-__v');
    
    const total = await Inquiry.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting inquiries'
    });
  }
});

module.exports = router;