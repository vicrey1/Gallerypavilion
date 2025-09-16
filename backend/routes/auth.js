const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const {
  authenticateToken,
  authenticateRefreshToken,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  updateLastLogin
} = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour per IP
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again later.'
  }
});

// @route   POST /api/auth/signup
// @desc    Register a new photographer
// @access  Public
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      businessName,
      bio,
      website,
      instagram,
      location,
      specialties
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'PHOTOGRAPHER',
      status: 'PENDING'
    };

    // Add optional fields if provided
    if (businessName) userData.businessName = businessName.trim();
    if (bio) userData.bio = bio.trim();
    if (website) userData.website = website.trim();
    if (instagram) userData.instagram = instagram.trim();
    if (location) userData.location = location.trim();
    if (specialties && Array.isArray(specialties)) {
      userData.specialties = specialties.filter(s => s && s.trim());
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Return user data (password excluded by toJSON transform)
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Pending admin approval.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        businessName: user.businessName,
        bio: user.bio,
        website: user.website,
        instagram: user.instagram,
        location: user.location,
        specialties: user.specialties,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', /* authLimiter, */ async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findByEmailWithPassword(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Return user data (password excluded)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio,
      website: user.website,
      instagram: user.instagram,
      location: user.location,
      specialties: user.specialties,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  try {
    clearTokenCookie(res);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, updateLastLogin, (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      bio: req.user.bio,
      website: req.user.website,
      instagram: req.user.instagram,
      location: req.user.location,
      specialties: req.user.specialties,
      profileImage: req.user.profileImage,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      approvedAt: req.user.approvedAt
    };

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      website,
      instagram,
      location,
      specialties
    } = req.body;

    const updateData = {};
    
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (instagram !== undefined) updateData.instagram = instagram.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (specialties && Array.isArray(specialties)) {
      updateData.specialties = specialties.filter(s => s && s.trim());
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        bio: user.bio,
        website: user.website,
        instagram: user.instagram,
        location: user.location,
        specialties: user.specialties,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateRefreshToken, (req, res) => {
  try {
    console.log('Refresh token endpoint called for user:', req.user._id);
    // Generate new token
    const token = generateToken(req.user._id);
    setTokenCookie(res, token);
    console.log('New token generated and set in cookie');

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error refreshing token'
    });
  }
});

module.exports = router;