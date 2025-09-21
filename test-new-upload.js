const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test uploading a new photo to see if it uses Cloudinary
async function testNewUpload() {
  const LOCAL_URL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing new photo upload with Cloudinary...');
    
    // Step 1: Login as admin
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      email: 'admin@gallerypavilion.com',
      password: 'admin123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get galleries
    console.log('\n2. Getting galleries...');
    const galleriesResponse = await axios.get(`${LOCAL_URL}/api/galleries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const gallery = galleriesResponse.data.galleries[0];
    console.log(`✅ Using gallery: ${gallery.title} (${gallery._id})`);
    
    // Step 3: Create a simple test image
    console.log('\n3. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-cloudinary-image.jpg');
    
    // Create a minimal JPEG file (1x1 pixel)
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, minimalJpeg);
    console.log('✅ Test image created');
    
    // Step 4: Upload the image
    console.log('\n4. Uploading test image...');
    const form = new FormData();
    form.append('photos', fs.createReadStream(testImagePath));
    form.append('galleryId', gallery._id);
    form.append('title', 'Cloudinary Test Upload');
    form.append('description', 'Testing if new uploads use Cloudinary');
    
    const uploadResponse = await axios.post(`${LOCAL_URL}/api/galleries/${gallery._id}/photos`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload successful');
    const uploadedPhoto = uploadResponse.data.photos[0];
    console.log(`Photo ID: ${uploadedPhoto._id}`);
    
    // Step 5: Check the uploaded photo details
    console.log('\n5. Checking uploaded photo details...');
    const photoResponse = await axios.get(`${LOCAL_URL}/api/photos/${uploadedPhoto._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const photo = photoResponse.data;
    console.log(`Storage Type: ${photo.storageType || 'undefined'}`);
    
    if (photo.cloudinary) {
      console.log('🎉 SUCCESS! Cloudinary data found:');
      console.log(`- Public ID: ${photo.cloudinary.publicId}`);
      console.log(`- Original URL: ${photo.cloudinary.originalUrl}`);
      console.log(`- Preview URL: ${photo.cloudinary.previewUrl}`);
      console.log(`- Thumbnail URL: ${photo.cloudinary.thumbnailUrl}`);
      
      // Test the Cloudinary URLs
      console.log('\n6. Testing Cloudinary URLs...');
      try {
        const previewTest = await axios.head(photo.cloudinary.previewUrl);
        console.log(`✅ Cloudinary Preview URL works: ${previewTest.status}`);
      } catch (error) {
        console.log(`❌ Cloudinary Preview URL failed: ${error.response?.status || error.message}`);
      }
      
      try {
        const thumbnailTest = await axios.head(photo.cloudinary.thumbnailUrl);
        console.log(`✅ Cloudinary Thumbnail URL works: ${thumbnailTest.status}`);
      } catch (error) {
        console.log(`❌ Cloudinary Thumbnail URL failed: ${error.response?.status || error.message}`);
      }
    } else {
      console.log('❌ FAILED! No Cloudinary data found');
      console.log('Photo data:', JSON.stringify(photo, null, 2));
    }
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 Cleaned up test image');
    
    console.log('\n🎉 New upload test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testNewUpload();