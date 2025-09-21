const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token from HttpOnly cookie
const authenticateToken = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET environment variable');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration: JWT_SECRET is not set.'
      });
    }
    // Check for token in cookies first (preferred method)
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token with proper options
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'gallery-pavilion',
      audience: 'gallery-pavilion-users'
    });
    } catch (verifyError) {
      // rethrow so outer catch handles specific JWT errors
      throw verifyError;
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Check if user account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Special authentication for refresh endpoint that allows expired tokens
const authenticateRefreshToken = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET environment variable');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration: JWT_SECRET is not set.'
      });
    }
    // Check for token in cookies first (preferred method)
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token, but ignore expiration for refresh
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { 
        ignoreExpiration: true,
        issuer: 'gallery-pavilion',
        audience: 'gallery-pavilion-users'
      });
    } catch (verifyError) {
      throw verifyError;
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Check if user account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Refresh token authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Check if user is approved photographer
const requireApprovedPhotographer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Allow admins to pass through
  if (req.user.role === 'ADMIN') {
    return next();
  }
  
  if (req.user.role !== 'PHOTOGRAPHER') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Photographer role required.'
    });
  }
  
  if (req.user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account pending approval.'
    });
  }
  
  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  
  next();
};

// Check if user is photographer (approved or pending)
const requirePhotographer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'PHOTOGRAPHER') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Photographer role required.'
    });
  }
  
  next();
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceField = 'photographer') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin can access everything
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    // Check ownership based on resource field
    const resourceOwnerId = req.resource ? req.resource[resourceField] : null;
    
    if (!resourceOwnerId) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.'
      });
    }
    
    if (resourceOwnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'gallery-pavilion',
        audience: 'gallery-pavilion-users'
      });
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator based on IP and email
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
};

// Middleware to check if user can perform action based on status
const checkUserStatus = (allowedStatuses = ['APPROVED']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!allowedStatuses.includes(req.user.status)) {
      let message = 'Access denied.';
      
      switch (req.user.status) {
        case 'PENDING':
          message = 'Account pending approval. Please wait for admin approval.';
          break;
        case 'REJECTED':
          message = 'Account has been rejected. Please contact support.';
          break;
        default:
          message = 'Account status does not allow this action.';
      }
      
      return res.status(403).json({
        success: false,
        message
      });
    }
    
    next();
  };
};

// Middleware to update last login time
const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET environment variable when generating token');
    throw new Error('JWT_SECRET is not configured on the server');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'gallery-pavilion',
      audience: 'gallery-pavilion-users'
    }
  );
};

// Set JWT cookie
const setTokenCookie = (res, token) => {
  // Determine SameSite policy and secure flag dynamically
  const sameSite = process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
  const secure = process.env.NODE_ENV === 'production' || sameSite === 'none';

  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
  
  res.cookie('token', token, cookieOptions);
};

// Clear JWT cookie
const clearTokenCookie = (res) => {
  // Mirror the same cookie attributes used when setting to ensure proper clearing
  const sameSite = process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
  const secure = process.env.NODE_ENV === 'production' || sameSite === 'none';

  res.clearCookie('token', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/'
  });
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  requireApprovedPhotographer,
  requireAdmin,
  requirePhotographer,
  requireOwnershipOrAdmin,
  optionalAuth,
  authRateLimit,
  checkUserStatus,
  updateLastLogin,
  generateToken,
  setTokenCookie,
  clearTokenCookie
};