const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

let photoBucket;

// Initialize GridFS bucket when MongoDB connects
mongoose.connection.once('open', () => {
  photoBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'photos'
  });
  console.log('✅ GridFS photo bucket initialized');
});

// Get GridFS bucket
const getPhotoBucket = () => {
  if (!photoBucket) {
    throw new Error('GridFS bucket not initialized. Ensure MongoDB is connected.');
  }
  return photoBucket;
};

// Upload file to GridFS
const uploadToGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getPhotoBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date()
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', (file) => {
      resolve({
        id: file._id,
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata
      });
    });

    uploadStream.end(buffer);
  });
};

// Get file from GridFS
const getFromGridFS = (filename) => {
  return new Promise((resolve, reject) => {
    const bucket = getPhotoBucket();
    const downloadStream = bucket.openDownloadStreamByName(filename);
    const chunks = [];

    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('error', reject);
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

// Delete file from GridFS
const deleteFromGridFS = async (filename) => {
  try {
    const bucket = getPhotoBucket();
    const files = await bucket.find({ filename }).toArray();
    
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting from GridFS:', error);
    throw error;
  }
};

// Check if file exists in GridFS
const existsInGridFS = async (filename) => {
  try {
    const bucket = getPhotoBucket();
    const files = await bucket.find({ filename }).toArray();
    return files.length > 0;
  } catch (error) {
    console.error('Error checking GridFS file:', error);
    return false;
  }
};

// Process and upload image with multiple sizes
const processAndUploadToGridFS = async (buffer, originalFilename, options = {}) => {
  const {
    generateThumbnail = true,
    generatePreview = true,
    generateWatermarked = false,
    watermarkText = '',
    quality = 85
  } = options;

  const fileId = uuidv4();
  const ext = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, ext);
  
  const results = {};

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Upload original
    const originalFilename = `${fileId}_original${ext}`;
    const originalBuffer = await sharp(buffer)
      .jpeg({ quality: quality })
      .toBuffer();
    
    results.original = await uploadToGridFS(originalBuffer, originalFilename, {
      type: 'original',
      width: metadata.width,
      height: metadata.height,
      originalName: baseName
    });

    // Generate and upload preview (max 1200px width)
    if (generatePreview) {
      const previewFilename = `${fileId}_preview${ext}`;
      const previewBuffer = await sharp(buffer)
        .resize(1200, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: quality })
        .toBuffer();
      
      const previewMetadata = await sharp(previewBuffer).metadata();
      results.preview = await uploadToGridFS(previewBuffer, previewFilename, {
        type: 'preview',
        width: previewMetadata.width,
        height: previewMetadata.height,
        originalName: baseName
      });
    }

    // Generate and upload thumbnail (300x300)
    if (generateThumbnail) {
      const thumbnailFilename = `${fileId}_thumbnail${ext}`;
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: quality })
        .toBuffer();
      
      results.thumbnail = await uploadToGridFS(thumbnailBuffer, thumbnailFilename, {
        type: 'thumbnail',
        width: 300,
        height: 300,
        originalName: baseName
      });
    }

    // Generate and upload watermarked version
    if (generateWatermarked && watermarkText) {
      const watermarkedFilename = `${fileId}_watermarked${ext}`;
      const watermarkedBuffer = await sharp(buffer)
        .composite([{
          input: Buffer.from(`
            <svg width="${metadata.width}" height="${metadata.height}">
              <text x="50%" y="95%" 
                    font-family="Arial, sans-serif" 
                    font-size="${Math.max(20, metadata.width * 0.02)}" 
                    fill="rgba(255,255,255,0.7)" 
                    text-anchor="middle">
                ${watermarkText}
              </text>
            </svg>
          `),
          top: 0,
          left: 0
        }])
        .jpeg({ quality: quality })
        .toBuffer();
      
      results.watermarked = await uploadToGridFS(watermarkedBuffer, watermarkedFilename, {
        type: 'watermarked',
        width: metadata.width,
        height: metadata.height,
        originalName: baseName,
        watermark: watermarkText
      });
    }

    return results;
  } catch (error) {
    // Clean up any uploaded files on error
    for (const result of Object.values(results)) {
      if (result && result.filename) {
        try {
          await deleteFromGridFS(result.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up GridFS file:', cleanupError);
        }
      }
    }
    throw error;
  }
};

// Multer storage engine for GridFS
const createGridFSStorage = () => {
  return multer.memoryStorage(); // Store in memory first, then process and upload to GridFS
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

// Create GridFS upload configuration
const createGridFSUploadConfig = (options = {}) => {
  const {
    maxFiles = 20,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    fileFilter: customFilter = imageFilter
  } = options;

  return multer({
    storage: createGridFSStorage(),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: customFilter
  });
};

// GridFS photo upload middleware
const gridfsPhotoUpload = createGridFSUploadConfig({
  maxFiles: 20,
  maxFileSize: 50 * 1024 * 1024 // 50MB
});

// Process uploaded images middleware for GridFS
const processGridFSImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = [];
    
    for (const file of req.files) {
      const processed = await processAndUploadToGridFS(file.buffer, file.originalname, {
        generateThumbnail: true,
        generatePreview: true,
        generateWatermarked: false, // Can be enabled based on gallery settings
        quality: 85
      });
      
      processedFiles.push({
        original: processed.original,
        preview: processed.preview,
        thumbnail: processed.thumbnail,
        watermarked: processed.watermarked,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
    }
    
    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    console.error('Error processing GridFS images:', error);
    next(error);
  }
};

// Check if GridFS is available
const isGridFSAvailable = () => {
  return mongoose.connection.readyState === 1 && !!photoBucket;
};

module.exports = {
  uploadToGridFS,
  getFromGridFS,
  deleteFromGridFS,
  existsInGridFS,
  processAndUploadToGridFS,
  gridfsPhotoUpload,
  processGridFSImages,
  createGridFSUploadConfig,
  isGridFSAvailable,
  imageFilter,
  getPhotoBucket
};