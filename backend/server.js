const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const galleryRoutes = require('./routes/galleries');
const photoRoutes = require('./routes/photos');
const shareRoutes = require('./routes/share');
const inquiryRoutes = require('./routes/inquiries');
const invitationRoutes = require('./routes/invitations');

const app = express();
const PORT = process.env.PORT || 5000;
const isServerless = !!process.env.VERCEL;

// Trust proxy for Vercel deployment (required for rate limiting and IP detection)
if (process.env.NODE_ENV === 'production' || isServerless) {
  app.set('trust proxy', 1);
}

// Include Vercel-provided deployment URLs as allowed origins, e.g. my-app.vercel.app
const vercelUrls = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
  .filter(Boolean)
  .map((u) => `https://${u}`);

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
}

// Rate limiting with proper proxy support
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for failed requests to avoid blocking legitimate retries
  skipFailedRequests: true,
  // Skip successful requests for certain endpoints
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Apply rate limiting only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  ...vercelUrls
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow same-origin automatically (important for Vercel rewrites serving API on same domain)
    try {
      const originHost = new URL(origin).host;
      const reqHost = this?.req?.get ? this.req.get('host') : null; // fallback if not bound
      // If req is not available via this, try callback-bound function variant
    } catch (_) {
      // ignore URL parse errors
    }

    // Fallback same-origin check using provided req (function signature origin, callback doesn't pass req),
    // so we'll compute it inside a wrapper middleware below
    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Inject a small middleware before to properly allow same-origin based on req
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    const originHost = new URL(origin).host;
    const reqHost = req.get('host');
    if (originHost === reqHost) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  } catch (_) {}
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware to ensure DB is connected before handling requests that require DB
const ensureDbConnected = (req, res, next) => {
  const readyState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState !== 1) {
    console.error(`DB not connected (state=${readyState}). Request: ${req.method} ${req.originalUrl}`);
    // Allow cached share responses to be served when DB is down.
    try {
      const shareMatch = req.originalUrl.match(/^\/api\/share\/([^\/\?]+)/i);
      if (shareMatch && shareMatch[1] && req.method === 'GET') {
        const fs = require('fs');
        const cacheBase = process.env.SHARE_CACHE_DIR || path.join(os.tmpdir(), 'gallerypavilion_cache');
        const cachePath = path.join(cacheBase, `share_${shareMatch[1]}.json`);
        if (fs.existsSync(cachePath)) {
          const cached = fs.readFileSync(cachePath, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
    } catch (cacheErr) {
      console.error('Error reading share cache:', cacheErr);
    }

    return res.status(503).json({ success: false, message: 'Service unavailable: database not connected' });
  }
  next();
};

// Apply DB check middleware for API routes that need DB (applies to all /api routes)
// Exception: allow /api/share to reach the route so it can implement its own
// fallback logic (serve cached responses) when the DB is disconnected.
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/share')) return next();
  return ensureDbConnected(req, res, next);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/invitations', invitationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      success: false, 
      message: 'Validation Error', 
      errors 
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      success: false, 
      message: `${field} already exists` 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Token expired' 
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gallery-pavilion';

// Set explicit mongoose options to avoid long buffering and provide better timeouts
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000, // 5s
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) || 45000,
  connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) || 10000
};

mongoose.connect(mongoUri, mongooseOptions).catch(err => {
  // The initial connect may reject; we'll log and allow process to continue in serverless
  console.error('❌ Initial MongoDB connection error:', err && err.message ? err.message : err);
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Reconnected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err && err.message ? err.message : err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('close', () => {
  console.warn('⚠️ MongoDB connection closed');
});

// Start server only in non-serverless environments
if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  console.log('🛰️ Serverless runtime detected (Vercel): not calling app.listen');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;