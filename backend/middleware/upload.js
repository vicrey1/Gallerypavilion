const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const imageProcessor = require('../utils/imageProcessor');
const { 
  cloudPhotoUpload, 
  processCloudImages, 
  isCloudStorageConfigured 
} = require('../utils/cloudStorage');
const {
  gridfsPhotoUpload,
  processGridFSImages,
  isGridFSAvailable
} = require('../utils/gridfsStorage');
const {
  cloudinaryPhotoUpload,
  processCloudinaryImages,
  isCloudinaryConfigured
} = require('../utils/cloudinaryStorage');

// Configure storage
const createStorage = (uploadType = 'photos') => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      let uploadDir;
      
      switch (uploadType) {
        case 'photos':
          uploadDir = path.join(__dirname, '../uploads/photos');
          break;
        case 'profiles':
          uploadDir = path.join(__dirname, '../uploads/profiles');
          break;
        case 'temp':
          uploadDir = path.join(__dirname, '../uploads/temp');
          break;
        default:
          uploadDir = path.join(__dirname, '../uploads/misc');
      }
      
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        console.error('Error creating upload directory:', error);
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50); // Limit base name length
      
      cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    }
  });
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

// File filter for profile pictures
const profileImageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP files are allowed for profile pictures'));
  }
};

// Create upload configurations
const createUploadConfig = (options = {}) => {
  const {
    uploadType = 'photos',
    maxFiles = 20,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    fileFilter = imageFilter
  } = options;

  return multer({
    storage: createStorage(uploadType),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter
  });
};

// Dynamic upload middleware - prioritize Cloudinary, then GridFS, then S3, then local
const photoUpload = (req, res, next) => {
  const middleware = isCloudinaryConfigured()
    ? cloudinaryPhotoUpload
    : isGridFSAvailable() 
      ? gridfsPhotoUpload
      : isCloudStorageConfigured() 
        ? cloudPhotoUpload
        : createUploadConfig({
            uploadType: 'photos',
            maxFiles: 20,
            maxFileSize: 50 * 1024 * 1024
          });
  
  console.log('📁 Using upload middleware:', 
    isCloudinaryConfigured() ? 'Cloudinary' : 
    isGridFSAvailable() ? 'GridFS' : 
    isCloudStorageConfigured() ? 'S3 Cloud' : 'Local');
  return middleware.array('photos', 20)(req, res, next);
};

const profileUpload = createUploadConfig({
  uploadType: 'profiles',
  maxFiles: 1,
  maxFileSize: 5 * 1024 * 1024, // 5MB for profile pictures
  fileFilter: profileImageFilter
});

const singlePhotoUpload = createUploadConfig({
  uploadType: 'photos',
  maxFiles: 1,
  maxFileSize: 50 * 1024 * 1024
});

// Middleware to process uploaded images - prioritize Cloudinary, then GridFS, then S3, then local
const processUploadedImages = (options = {}) => {
  // Use Cloudinary processing if configured, then GridFS, then S3 cloud, then local
  if (isCloudinaryConfigured()) {
    return processCloudinaryImages(options);
  } else if (isGridFSAvailable()) {
    return processGridFSImages(options);
  } else if (isCloudStorageConfigured()) {
    return processCloudImages(options);
  }

  // Fallback to local processing for development
  return async (req, res, next) => {
    if (!req.files && !req.file) {
      return next();
    }

    const {
      createThumbnail = true,
      createPreview = true,
      quality = 85,
      validateImages = true
    } = options;

    try {
      const files = req.files || [req.file];
      const processedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          // Validate image if requested
          if (validateImages) {
            const validation = await imageProcessor.validateImage(file.path);
            if (!validation.isValid) {
              errors.push({
                filename: file.originalname,
                errors: validation.errors
              });
              
              // Clean up invalid file
              try {
                await fs.unlink(file.path);
              } catch (unlinkError) {
                console.error('Error cleaning up invalid file:', unlinkError);
              }
              continue;
            }
          }

          // Process the image
          const processedImage = await imageProcessor.processImage(file.path, {
            createThumbnail,
            createPreview,
            quality
          });

          // Move processed files to uploads directory if they were created in current directory
          const uploadsDir = path.dirname(file.path);
          const currentDir = process.cwd();
          
          // Check if thumbnail was created in current directory and move it
          if (processedImage.thumbnail && processedImage.thumbnail.path.startsWith(currentDir)) {
            const thumbnailName = path.basename(processedImage.thumbnail.path);
            const newThumbnailPath = path.join(uploadsDir, thumbnailName);
            await fs.rename(processedImage.thumbnail.path, newThumbnailPath);
            processedImage.thumbnail.path = newThumbnailPath;
          }
          
          // Check if preview was created in current directory and move it
          if (processedImage.preview && processedImage.preview.path.startsWith(currentDir)) {
            const previewName = path.basename(processedImage.preview.path);
            const newPreviewPath = path.join(uploadsDir, previewName);
            await fs.rename(processedImage.preview.path, newPreviewPath);
            processedImage.preview.path = newPreviewPath;
          }
          


          // Extract EXIF data
          const exifData = await imageProcessor.extractExifData(file.path);

          // Combine file info with processed results
          const fileInfo = {
            ...file,
            processed: processedImage,
            exifData
          };

          processedFiles.push(fileInfo);

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          errors.push({
            filename: file.originalname,
            error: 'Failed to process image'
          });
          
          // Clean up file on error
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
      }

      // Attach processed files and errors to request
      req.processedFiles = processedFiles;
      req.uploadErrors = errors;

      next();

    } catch (error) {
      console.error('Error in image processing middleware:', error);
      
      // Clean up all uploaded files on error
      const files = req.files || [req.file];
      if (files) {
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
      }
      
      return res.status(500).json({ 
        message: 'Image processing failed',
        error: error.message 
      });
    }
  };
};

// Middleware to handle upload errors
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'File too large',
          error: 'File size exceeds the maximum allowed limit'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files',
          error: 'Number of files exceeds the maximum allowed limit'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected file field',
          error: 'Unexpected file field in the request'
        });
      default:
        return res.status(400).json({ 
          message: 'Upload error',
          error: error.message
        });
    }
  }
  
  if (error.message.includes('Only image files are allowed') || 
      error.message.includes('Only JPEG, PNG, and WebP files are allowed')) {
    return res.status(400).json({ 
      message: 'Invalid file type',
      error: error.message
    });
  }
  
  next(error);
};

// Cleanup middleware for failed requests
const cleanupOnError = async (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = async () => {
    if (res.statusCode >= 400) {
      const files = req.files || (req.file ? [req.file] : []);
      if (files.length > 0) {
        const filePaths = files.map(file => file.path);
        await imageProcessor.cleanupFiles(filePaths);
      }
      
      // Also cleanup processed files if they exist
      if (req.processedFiles) {
        const processedPaths = [];
        req.processedFiles.forEach(file => {
          if (file.processed.thumbnail) processedPaths.push(file.processed.thumbnail.path);
          if (file.processed.preview) processedPaths.push(file.processed.preview.path);

        });
        
        if (processedPaths.length > 0) {
          await imageProcessor.cleanupFiles(processedPaths);
        }
      }
    }
  };
  
  res.send = function(data) {
    cleanup().finally(() => {
      originalSend.call(this, data);
    });
  };
  
  res.json = function(data) {
    cleanup().finally(() => {
      originalJson.call(this, data);
    });
  };
  
  next();
};

module.exports = {
  // Upload configurations
  photoUpload,
  profileUpload,
  singlePhotoUpload,
  createUploadConfig,
  
  // Processing middleware
  processUploadedImages,
  
  // Error handling
  handleUploadErrors,
  cleanupOnError,
  
  // Filters
  imageFilter,
  profileImageFilter
};