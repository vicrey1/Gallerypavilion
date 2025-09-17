const AWS = require('aws-sdk');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'gallery-pavilion-storage';

// Helper function to generate unique filename
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  const uniqueId = uuidv4();
  return `${baseName}_${Date.now()}_${uniqueId}${ext}`;
};

// Upload file to S3
const uploadToS3 = async (buffer, filename, mimetype, folder = 'photos') => {
  const key = `${folder}/${filename}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'private' // Keep files private, use signed URLs for access
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      key: result.Key,
      location: result.Location,
      bucket: result.Bucket
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

// Generate signed URL for private file access
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn // URL expires in 1 hour by default
  };

  return s3.getSignedUrl('getObject', params);
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

// Process and upload image with variants (thumbnail, preview, watermarked)
const processAndUploadImage = async (fileBuffer, originalName, mimetype) => {
  const baseFilename = generateUniqueFilename(originalName);
  const nameWithoutExt = path.parse(baseFilename).name;
  const ext = path.parse(baseFilename).ext;

  try {
    // Original image
    const originalUpload = await uploadToS3(fileBuffer, baseFilename, mimetype, 'photos/original');

    // Create thumbnail (300x300)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();
    const thumbnailFilename = `${nameWithoutExt}_thumb${ext}`;
    const thumbnailUpload = await uploadToS3(thumbnailBuffer, thumbnailFilename, 'image/jpeg', 'photos/thumbnails');

    // Create preview (1200px max width/height)
    const previewBuffer = await sharp(fileBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const previewFilename = `${nameWithoutExt}_preview${ext}`;
    const previewUpload = await uploadToS3(previewBuffer, previewFilename, 'image/jpeg', 'photos/previews');

    // Create watermarked version
    const watermarkText = process.env.WATERMARK_TEXT || 'Gallery Pavilion';
    const watermarkedBuffer = await sharp(fileBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .composite([{
        input: Buffer.from(
          `<svg width="200" height="50">
            <text x="10" y="30" font-family="Arial" font-size="16" fill="white" fill-opacity="0.7">${watermarkText}</text>
          </svg>`
        ),
        gravity: 'southeast'
      }])
      .jpeg({ quality: 90 })
      .toBuffer();
    const watermarkedFilename = `${nameWithoutExt}_watermarked${ext}`;
    const watermarkedUpload = await uploadToS3(watermarkedBuffer, watermarkedFilename, 'image/jpeg', 'photos/watermarked');

    // Get image dimensions
    const metadata = await sharp(fileBuffer).metadata();

    return {
      original: {
        key: originalUpload.key,
        location: originalUpload.location,
        filename: baseFilename,
        size: fileBuffer.length,
        width: metadata.width,
        height: metadata.height
      },
      thumbnail: {
        key: thumbnailUpload.key,
        location: thumbnailUpload.location,
        filename: thumbnailFilename
      },
      preview: {
        key: previewUpload.key,
        location: previewUpload.location,
        filename: previewFilename
      },
      watermarked: {
        key: watermarkedUpload.key,
        location: watermarkedUpload.location,
        filename: watermarkedFilename
      }
    };
  } catch (error) {
    console.error('Error processing and uploading image:', error);
    throw new Error('Failed to process and upload image');
  }
};

// Multer memory storage for cloud uploads
const createCloudStorage = () => {
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

// Create cloud upload configuration
const createCloudUploadConfig = (options = {}) => {
  const {
    maxFiles = 20,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    fileFilter: customFilter = imageFilter
  } = options;

  return multer({
    storage: createCloudStorage(),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: customFilter
  });
};

// Pre-configured cloud upload middleware
const cloudPhotoUpload = createCloudUploadConfig({
  maxFiles: 20,
  maxFileSize: 50 * 1024 * 1024
});

// Middleware to process uploaded images for cloud storage
const processCloudImages = (options = {}) => {
  return async (req, res, next) => {
    if (!req.files && !req.file) {
      return next();
    }

    try {
      const files = req.files || [req.file];
      const processedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          // Validate file size and type
          if (file.size > 50 * 1024 * 1024) {
            errors.push({
              filename: file.originalname,
              error: 'File size exceeds 50MB limit'
            });
            continue;
          }

          // Process and upload the image
          const uploadResult = await processAndUploadImage(
            file.buffer,
            file.originalname,
            file.mimetype
          );

          // Combine file info with upload results
          const fileInfo = {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            ...uploadResult
          };

          processedFiles.push(fileInfo);

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          errors.push({
            filename: file.originalname,
            error: 'Failed to process and upload image'
          });
        }
      }

      // Attach processed files and errors to request
      req.processedFiles = processedFiles;
      req.uploadErrors = errors;

      next();

    } catch (error) {
      console.error('Error in cloud image processing middleware:', error);
      return res.status(500).json({ 
        message: 'Image processing failed',
        error: error.message 
      });
    }
  };
};

// Check if cloud storage is configured
const isCloudStorageConfigured = () => {
  return !!(process.env.AWS_ACCESS_KEY_ID && 
           process.env.AWS_SECRET_ACCESS_KEY && 
           process.env.S3_BUCKET_NAME);
};

module.exports = {
  uploadToS3,
  getSignedUrl,
  deleteFromS3,
  processAndUploadImage,
  cloudPhotoUpload,
  processCloudImages,
  createCloudUploadConfig,
  isCloudStorageConfigured,
  imageFilter
};