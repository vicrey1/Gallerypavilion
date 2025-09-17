const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function debugSharp() {
  try {
    console.log('🔍 Debugging Sharp image processing...');
    
    // Create the same test image as in the upload test
    const testImagePath = path.join(__dirname, 'debug-test-image.png');
    
    // Create a 100x100 red square PNG image
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .png()
    .toFile(testImagePath);
    
    console.log('✅ Test image created');
    
    // Read the file as buffer (simulating multer behavior)
    const fileBuffer = fs.readFileSync(testImagePath);
    console.log(`📊 File buffer size: ${fileBuffer.length} bytes`);
    console.log(`📊 Buffer type: ${typeof fileBuffer}`);
    console.log(`📊 Is Buffer: ${Buffer.isBuffer(fileBuffer)}`);
    
    // Test Sharp processing with the buffer
    console.log('\n🔧 Testing Sharp processing...');
    
    // Get metadata
    const metadata = await sharp(fileBuffer).metadata();
    console.log('✅ Metadata:', metadata);
    
    // Test JPEG conversion
    const jpegBuffer = await sharp(fileBuffer)
      .jpeg({ quality: 85 })
      .toBuffer();
    console.log(`✅ JPEG conversion successful, size: ${jpegBuffer.length} bytes`);
    
    // Test resize
    const resizedBuffer = await sharp(fileBuffer)
      .resize(300, 300, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    console.log(`✅ Resize successful, size: ${resizedBuffer.length} bytes`);
    
    // Test preview generation (like in GridFS)
    const previewBuffer = await sharp(fileBuffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    console.log(`✅ Preview generation successful, size: ${previewBuffer.length} bytes`);
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All Sharp operations completed successfully!');
    console.log('The issue might be with how the buffer is passed from multer.');
    
  } catch (error) {
    console.error('❌ Sharp processing failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

debugSharp();