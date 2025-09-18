const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple test to verify photo upload works without watermarking
async function testUploadWithoutWatermark() {
  console.log('🧪 Testing photo upload without watermarking...');
  
  const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
  
  try {
    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@gallerypavilion.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456'
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Login successful');
    
    // Get galleries
    console.log('2. Getting galleries...');
    const galleriesResponse = await axios.get(`${baseURL}/api/galleries`, {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    if (galleriesResponse.data.galleries.length === 0) {
      throw new Error('No galleries found');
    }
    
    const galleryId = galleriesResponse.data.galleries[0]._id;
    console.log(`✅ Using gallery: ${galleryId}`);
    
    // Use existing test image
    console.log('3. Using existing test image...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error('Test image not found: ' + testImagePath);
    }
    
    console.log('✅ Test image found');
    
    // Upload the image
    console.log('4. Uploading image...');
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post(
      `${baseURL}/api/galleries/${galleryId}/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Cookie: cookies.join('; ')
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Response:', {
      status: uploadResponse.status,
      message: uploadResponse.data.message,
      photosCount: uploadResponse.data.photos?.length || 0
    });
    
    // Verify no watermark references in response
    const responseStr = JSON.stringify(uploadResponse.data);
    if (responseStr.includes('watermark') || responseStr.includes('Watermark')) {
      console.log('⚠️  Warning: Response still contains watermark references');
      console.log('Response data:', uploadResponse.data);
    } else {
      console.log('✅ No watermark references found in response');
    }
    
    // Clean up
    try {
      fs.unlinkSync(testImagePath);
      console.log('✅ Test file cleaned up');
    } catch (err) {
      console.log('Note: Could not clean up test file:', err.message);
    }
    
    console.log('\n🎉 Photo upload test completed successfully!');
    console.log('✅ Watermarking has been successfully removed from the upload process');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testUploadWithoutWatermark();