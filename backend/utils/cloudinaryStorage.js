const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to generate unique public ID
const generateUniquePublicId = (originalName, folder = 'gallery-pavilion') => {
  const baseName = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const uniqueId = uuidv4().substring(0, 8);
  const timestamp = Date.now();
  return `${folder}/${baseName}_${timestamp}_${uniqueId}`;
};

// Upload buffer to Cloudinary with transformations
const uploadToCloudinary = async (buffer, originalName, options = {}) => {
  const {
    folder = 'gallery-pavilion/photos',
    generateThumbnail = true,
    generatePreview = true
  } = options;

  try {
    const publicId = generateUniquePublicId(originalName, folder);
    
    // Upload original image
    const originalUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const results = {
      original: {
        publicId: originalUpload.public_id,
        url: originalUpload.secure_url,
        width: originalUpload.width,
        height: originalUpload.height,
        format: originalUpload.format,
        bytes: originalUpload.bytes
      }
    };

    // Generate thumbnail (300x300, crop to fill)
    if (generateThumbnail) {
      const thumbnailUrl = cloudinary.url(originalUpload.public_id, {
        width: 300,
        height: 300,
        crop: 'fill'
      });
      
      results.thumbnail = {
        publicId: originalUpload.public_id,
        url: thumbnailUrl,
        transformation: 'w_300,h_300,c_fill'
      };
    }

    // Generate preview (1200px max width, maintain aspect ratio)
    if (generatePreview) {
      const previewUrl = cloudinary.url(originalUpload.public_id, {
        width: 1200,
        height: 1200,
        crop: 'limit'
      });
      
      results.preview = {
        publicId: originalUpload.public_id,
        url: previewUrl,
        transformation: 'w_1200,h_1200,c_limit'
      };
    }



    return results;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Get optimized URL with transformations
const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!publicId) return null;
  
  const defaultTransformations = {};
  
  return cloudinary.url(publicId, { ...defaultTransformations, ...transformations });
};

// Get thumbnail URL
const getThumbnailUrl = (publicId) => {
  return getCloudinaryUrl(publicId, {
    width: 300,
    height: 300,
    crop: 'fill'
  });
};

// Get preview URL
const getPreviewUrl = (publicId) => {
  return getCloudinaryUrl(publicId, {
    width: 1200,
    height: 1200,
    crop: 'limit'
  });
};

// Get download URL (original quality)
const getDownloadUrl = (publicId, filename) => {
  return cloudinary.url(publicId, {
    flags: 'attachment',
    public_id: publicId
  });
};

// Multer storage engine for Cloudinary (memory storage)
const createCloudinaryStorage = () => {
  return multer.memoryStorage();
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|tiff|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, TIFF, BMP)'));
  }
};

// Create Cloudinary upload configuration
const createCloudinaryUploadConfig = (options = {}) => {
  const {
    maxFiles = 20,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    fileFilter: customFilter = imageFilter
  } = options;

  return multer({
    storage: createCloudinaryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: customFilter
  });
};

// Cloudinary photo upload middleware
const cloudinaryPhotoUpload = createCloudinaryUploadConfig({
  maxFiles: 20,
  maxFileSize: 50 * 1024 * 1024 // 50MB
});

// Process uploaded images middleware for Cloudinary
const processCloudinaryImages = (options = {}) => {
  const { timeout = 120000 } = options; // 2 minute timeout
  
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Set up timeout for the entire processing operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Image processing timeout - operation took too long'));
      }, timeout);
    });

    try {
      console.log(`Starting Cloudinary processing for ${req.files.length} files`);
      const startTime = Date.now();
      
      // Process files in parallel
      const processingPromise = Promise.all(
        req.files.map(async (file, index) => {
          try {
            console.log(`Processing file ${index + 1}/${req.files.length}: ${file.originalname}`);
            
            const fileStartTime = Date.now();
            const result = await uploadToCloudinary(file.buffer, file.originalname, {
              generateThumbnail: true,
              generatePreview: true
            });
            
            const fileEndTime = Date.now();
            console.log(`✅ File ${index + 1} processed in ${fileEndTime - fileStartTime}ms`);
            
            return {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: result.original.bytes,
              processed: result
            };
          } catch (error) {
            console.error(`❌ Error processing file ${file.originalname}:`, error);
            throw error;
          }
        })
      );

      // Race between processing and timeout
      const processedFiles = await Promise.race([processingPromise, timeoutPromise]);
      
      const endTime = Date.now();
      console.log(`✅ All ${req.files.length} files processed in ${endTime - startTime}ms`);
      
      // Attach processed files to request
      req.processedFiles = processedFiles;
      next();
      
    } catch (error) {
      console.error('❌ Cloudinary processing error:', error);
      
      if (error.message.includes('timeout')) {
        return res.status(504).json({
          message: 'Upload processing timeout',
          error: 'The image processing is taking too long. Please try uploading fewer or smaller images.',
          code: 'PROCESSING_TIMEOUT'
        });
      }
      
      return res.status(500).json({
        message: 'Image processing failed',
        error: error.message,
        code: 'PROCESSING_ERROR'
      });
    }
  };
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && 
           process.env.CLOUDINARY_API_KEY && 
           process.env.CLOUDINARY_API_SECRET);
};

// Get image metadata from Cloudinary
const getImageMetadata = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
      public_id: result.public_id,
      secure_url: result.secure_url
    };
  } catch (error) {
    console.error('Error getting Cloudinary metadata:', error);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  getThumbnailUrl,
  getPreviewUrl,
  getDownloadUrl,
  cloudinaryPhotoUpload,
  processCloudinaryImages,
  createCloudinaryUploadConfig,
  isCloudinaryConfigured,
  getImageMetadata,
  imageFilter
};