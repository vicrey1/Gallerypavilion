const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const ShareLink = require('../models/ShareLink');
const Gallery = require('../models/Gallery');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../utils/emailService');

// Send invitation email with automatic link generation
router.post('/send', authenticateToken, async (req, res) => {
  try {

    
    const {
      galleryId,
      recipientEmail,
      recipientName,
      expiresAt,
      maxUses
    } = req.body;

    // Validate required fields
    if (!galleryId || !recipientEmail) {

      return res.status(400).json({
        success: false,
        message: 'Gallery ID and recipient email are required'
      });
    }
    


    // Verify gallery exists and user owns it
    const gallery = await Gallery.findOne({
      _id: galleryId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found or access denied'
      });
    }

    // Check if gallery is invite-only
    if (!gallery.settings.inviteOnly) {
      return res.status(400).json({
        success: false,
        message: 'Gallery must be set to invite-only to send invitations'
      });
    }

    // Get photographer details
    const photographer = await User.findById(req.user.id);
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    // Create a ShareLink for the invitation
    const shareLinkData = {
      gallery: galleryId,
      photographer: req.user.id,
      name: `Email Invitation - ${recipientName || recipientEmail}`,
      description: `Email invitation sent to ${recipientEmail}`,
      permissions: {
        allowDownloads: false,
        showExif: false,
        watermarkEnabled: true,
        allowFullscreen: true,
        showPricing: true,
        allowInquiries: true
      }
    };

    if (expiresAt) {
      shareLinkData.expiresAt = new Date(expiresAt);
    }

    // Create the ShareLink (this will auto-generate the token)
    const shareLink = new ShareLink(shareLinkData);
    console.log('ShareLink before save - token:', shareLink.token);
    
    // Ensure token is generated before saving
    if (!shareLink.token) {
      shareLink.token = await ShareLink.generateUniqueToken();
    }
    
    await shareLink.save();
    console.log('ShareLink after save - token:', shareLink.token);
    await shareLink.populate('gallery photographer');

    // Create invitation record for tracking
    const invitationData = {
      gallery: galleryId,
      photographer: req.user.id,
      invitedBy: req.user.id,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      recipientName: recipientName?.trim(),
      code: shareLink.token // Use the ShareLink token as the invitation code
    };

    if (maxUses) {
      invitationData.maxUses = maxUses;
    }

    const invitation = new Invitation(invitationData);
    await invitation.save();
    await invitation.populate('gallery photographer');

    // Use shareLink for email instead of invitation
    const emailData = {
      ...invitation.toObject(),
      fullUrl: shareLink.fullUrl,
      token: shareLink.token
    };

    // Send the invitation email
    try {
      // Create photographer object with name field for email template
      const photographerForEmail = {
        ...photographer.toObject(),
        name: photographer.fullName
      };
      
      const emailResult = await emailService.sendInvitationEmail(
        emailData,
        gallery,
        photographerForEmail
      );

      res.status(201).json({
        success: true,
        message: 'Invitation created and sent successfully',
        data: {
          invitation,
          shareLink: {
            token: shareLink.token,
            url: shareLink.fullUrl
          },
          emailSent: true,
          emailMessageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl // For development
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Return success for invitation creation but note email failure
      res.status(201).json({
        success: true,
        message: 'Invitation created but email sending failed',
        data: {
          invitation,
          emailSent: false,
          emailError: emailError.message
        },
        warning: 'The invitation was created successfully, but the email could not be sent. Please check your email configuration.'
      });
    }

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create and send invitation',
      error: error.message
    });
  }
});

// Create invitation for a gallery (without sending email)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      galleryId,
      recipientEmail,
      recipientName,
      expiresAt,
      maxUses
    } = req.body;

    // Verify gallery exists and user owns it
    const gallery = await Gallery.findOne({
      _id: galleryId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found or access denied'
      });
    }

    // Check if gallery is invite-only
    if (!gallery.settings.inviteOnly) {
      return res.status(400).json({
        success: false,
        message: 'Gallery must be set to invite-only to create invitations'
      });
    }

    // Create invitation
    const invitationData = {
      gallery: galleryId,
      photographer: req.user.id,
      invitedBy: req.user.id,
      recipientEmail,
      recipientName
    };

    if (expiresAt) {
      invitationData.expiresAt = new Date(expiresAt);
    }

    if (maxUses) {
      invitationData.maxUses = maxUses;
    }

    const invitation = await Invitation.createInvitation(invitationData);
    await invitation.populate('gallery photographer');

    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: invitation
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invitation',
      error: error.message
    });
  }
});

// Get invitations for a gallery
router.get('/gallery/:galleryId', authenticateToken, async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { page = 1, limit = 10, status = 'all' } = req.query;

    // Verify gallery exists and user owns it
    const gallery = await Gallery.findOne({
      _id: galleryId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found or access denied'
      });
    }

    // Build query
    const query = {
      gallery: galleryId,
      isDeleted: false
    };

    if (status === 'active') {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiresAt = { $lte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;
    const invitations = await Invitation.find(query)
      .populate('recipientEmail recipientName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invitation.countDocuments(query);

    res.json({
      success: true,
      data: {
        invitations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message
    });
  }
});

// Validate invitation code (public endpoint)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invitation = await Invitation.findValidByCode(code);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation code'
      });
    }

    if (!invitation.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation is no longer valid'
      });
    }

    res.json({
      success: true,
      data: {
        code: invitation.code,
        gallery: {
          id: invitation.gallery._id,
          title: invitation.gallery.title,
          description: invitation.gallery.description,
          photographer: {
            name: invitation.photographer.fullName,
            email: invitation.photographer.email
          }
        },
        recipientName: invitation.recipientName,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        daysUntilExpiry: invitation.daysUntilExpiry
      }
    });

  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate invitation',
      error: error.message
    });
  }
});

// Use invitation code to access gallery (public endpoint)
router.post('/use/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { ip, userAgent } = req.body;

    const invitation = await Invitation.findValidByCode(code);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation code'
      });
    }

    if (!invitation.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation is no longer valid'
      });
    }

    // Record usage
    await invitation.recordUsage(ip, userAgent);

    // Return gallery access token or gallery data
    res.json({
      success: true,
      message: 'Invitation used successfully',
      data: {
        galleryId: invitation.gallery._id,
        galleryToken: invitation.gallery._id, // You might want to generate a temporary access token
        gallery: {
          id: invitation.gallery._id,
          title: invitation.gallery.title,
          description: invitation.gallery.description
        }
      }
    });

  } catch (error) {
    console.error('Use invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use invitation',
      error: error.message
    });
  }
});

// Update invitation
router.put('/:invitationId', authenticateToken, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updates = req.body;

    // Find invitation and verify ownership
    const invitation = await Invitation.findOne({
      _id: invitationId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or access denied'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['recipientEmail', 'recipientName', 'expiresAt', 'maxUses', 'isActive'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        invitation[field] = updates[field];
      }
    });

    await invitation.save();
    await invitation.populate('gallery photographer');

    res.json({
      success: true,
      message: 'Invitation updated successfully',
      data: invitation
    });

  } catch (error) {
    console.error('Update invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invitation',
      error: error.message
    });
  }
});

// Delete invitation
router.delete('/:invitationId', authenticateToken, async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find invitation and verify ownership
    const invitation = await Invitation.findOne({
      _id: invitationId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or access denied'
      });
    }

    // Soft delete
    invitation.isDeleted = true;
    invitation.deletedAt = new Date();
    invitation.deletedBy = req.user.id;
    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation deleted successfully'
    });

  } catch (error) {
    console.error('Delete invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invitation',
      error: error.message
    });
  }
});

// Resend invitation (regenerate code)
router.post('/:invitationId/resend', authenticateToken, async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find invitation and verify ownership
    const invitation = await Invitation.findOne({
      _id: invitationId,
      photographer: req.user.id,
      isDeleted: false
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or access denied'
      });
    }

    // Reset usage stats and generate new code
    invitation.code = undefined; // Will trigger new code generation
    invitation.stats.totalUses = 0;
    invitation.stats.firstUsedAt = null;
    invitation.stats.lastUsedAt = null;
    invitation.usageLog = [];
    invitation.isActive = true;

    await invitation.save();
    await invitation.populate('gallery photographer');

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      data: invitation
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message
    });
  }
});

module.exports = router;