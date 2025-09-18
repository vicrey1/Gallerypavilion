const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessor {
  constructor() {
    // Image processor for thumbnails and previews
  }

  /**
   * Process uploaded image - create thumbnails, previews, and apply watermarks
   * @param {string} inputPath - Path to the original image
   * @param {Object} options - Processing options
   * @returns {Object} - Processed image information
   */
  async processImage(inputPath, options = {}) {
    try {
      const {
        createThumbnail = true,
        createPreview = true,
        quality = 85
      } = options;

      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      const results = {
        original: {
          path: inputPath,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        thumbnail: null,
        preview: null
      };

      const baseFilename = path.parse(inputPath).name;
      const outputDir = path.dirname(inputPath);

      // Create thumbnail (300x300, square crop)
      if (createThumbnail) {
        const thumbnailPath = path.join(outputDir, `${baseFilename}_thumb.jpg`);
        await image
          .clone()
          .resize(300, 300, { 
            fit: 'cover', 
            position: 'center' 
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        results.thumbnail = {
          path: thumbnailPath,
          width: 300,
          height: 300
        };
      }

      // Create preview (max 1200px width, maintain aspect ratio)
      if (createPreview) {
        const previewPath = path.join(outputDir, `${baseFilename}_preview.jpg`);
        await image
          .clone()
          .resize(1200, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality })
          .toFile(previewPath);
        
        const previewMetadata = await sharp(previewPath).metadata();
        results.preview = {
          path: previewPath,
          width: previewMetadata.width,
          height: previewMetadata.height
        };
      }



      return results;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }



  /**
   * Resize image to specific dimensions
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output image path
   * @param {Object} options - Resize options
   * @returns {Object} - Resized image info
   */
  async resizeImage(inputPath, outputPath, options = {}) {
    try {
      const {
        width,
        height,
        fit = 'cover',
        position = 'center',
        quality = 85,
        format = 'jpeg'
      } = options;

      const image = sharp(inputPath);
      
      let resizeOptions = {};
      if (width || height) {
        resizeOptions = {
          width,
          height,
          fit,
          position
        };
      }

      const pipeline = image.resize(resizeOptions);
      
      // Apply format-specific options
      if (format === 'jpeg') {
        pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline.png({ quality });
      } else if (format === 'webp') {
        pipeline.webp({ quality });
      }

      await pipeline.toFile(outputPath);
      
      const metadata = await sharp(outputPath).metadata();
      
      return {
        path: outputPath,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      console.error('Error resizing image:', error);
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  /**
   * Extract EXIF data from image
   * @param {string} imagePath - Path to image
   * @returns {Object} - EXIF data
   */
  async extractExifData(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      const exifData = {
        camera: null,
        lens: null,
        focalLength: null,
        aperture: null,
        shutterSpeed: null,
        iso: null,
        dateTaken: null,
        gps: null
      };

      if (metadata.exif) {
        const exif = metadata.exif;
        
        // Extract common EXIF fields
        exifData.camera = exif.Make || null;
        exifData.lens = exif.Model || null;
        exifData.focalLength = exif.FocalLength || null;
        exifData.aperture = exif.FNumber || null;
        exifData.shutterSpeed = exif.ExposureTime || null;
        exifData.iso = exif.ISO || null;
        exifData.dateTaken = exif.DateTime || exif.DateTimeOriginal || null;
        
        // GPS data if available
        if (exif.GPSLatitude && exif.GPSLongitude) {
          exifData.gps = {
            latitude: exif.GPSLatitude,
            longitude: exif.GPSLongitude,
            altitude: exif.GPSAltitude || null
          };
        }
      }

      return exifData;
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return {};
    }
  }

  /**
   * Clean up processed image files
   * @param {Array} filePaths - Array of file paths to delete
   */
  async cleanupFiles(filePaths) {
    try {
      // Filter out undefined or null paths
      const validPaths = filePaths.filter(path => path && typeof path === 'string');
      
      if (validPaths.length === 0) {
        return;
      }
      
      const deletePromises = validPaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
          console.log(`Cleaned up file: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error.message);
        }
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Validate image file
   * @param {string} filePath - Path to image file
   * @returns {Object} - Validation result
   */
  async validateImage(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      const validation = {
        isValid: true,
        errors: [],
        metadata
      };

      // Check if it's a valid image
      if (!metadata.width || !metadata.height) {
        validation.isValid = false;
        validation.errors.push('Invalid image file');
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (metadata.size > maxSize) {
        validation.isValid = false;
        validation.errors.push('File size exceeds 50MB limit');
      }

      // Check dimensions (min 100x100, max 10000x10000)
      if (metadata.width < 100 || metadata.height < 100) {
        validation.isValid = false;
        validation.errors.push('Image dimensions too small (minimum 100x100)');
      }
      
      if (metadata.width > 10000 || metadata.height > 10000) {
        validation.isValid = false;
        validation.errors.push('Image dimensions too large (maximum 10000x10000)');
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid or corrupted image file'],
        metadata: null
      };
    }
  }
}

module.exports = new ImageProcessor();