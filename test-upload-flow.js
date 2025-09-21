const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test complete upload flow with Cloudinary
async function testUploadFlow() {
  const LOCAL_URL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing complete upload flow...');
    
    // Step 1: Login as admin to get access token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${LOCAL_URL}/api/auth/login`, {
      email: 'admin@gallerypavilion.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get or create a gallery
    console.log('\n2. Getting galleries...');
    const galleriesResponse = await axios.get(`${LOCAL_URL}/api/galleries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let galleryId;
    if (galleriesResponse.data.galleries && galleriesResponse.data.galleries.length > 0) {
      galleryId = galleriesResponse.data.galleries[0]._id;
      console.log(`✅ Using existing gallery: ${galleryId}`);
    } else {
      // Create a new gallery
      console.log('Creating new gallery...');
      const newGalleryResponse = await axios.post(`${LOCAL_URL}/api/galleries`, {
        title: 'Test Gallery for Upload',
        description: 'Testing Cloudinary upload'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      galleryId = newGalleryResponse.data.gallery._id;
      console.log(`✅ Created new gallery: ${galleryId}`);
    }
    
    // Step 3: Upload a test image
    console.log('\n3. Uploading test image...');
    
    // Check if test image exists, if not create a simple one
    const testImagePath = path.join(__dirname, 'backend', 'test-simple.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found at:', testImagePath);
      return;
    }
    
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post(
      `${LOCAL_URL}/api/galleries/${galleryId}/photos`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 30000 // 30 second timeout for upload
      }
    );
    
    console.log('✅ Upload successful!');
    console.log(`Uploaded ${uploadResponse.data.photos.length} photo(s)`);
    
    // Step 4: Check the uploaded photo data
    if (uploadResponse.data.photos.length > 0) {
      const uploadedPhoto = uploadResponse.data.photos[0];
      console.log('\n4. Checking uploaded photo data...');
      console.log(`Photo ID: ${uploadedPhoto._id}`);
      console.log(`Title: ${uploadedPhoto.title}`);
      console.log(`Storage Type: ${uploadedPhoto.storageType}`);
      
      if (uploadedPhoto.cloudinary) {
        console.log('\n☁️ Cloudinary data found:');
        console.log(`Public ID: ${uploadedPhoto.cloudinary.publicId}`);
        console.log(`Original URL: ${uploadedPhoto.cloudinary.originalUrl}`);
        console.log(`Preview URL: ${uploadedPhoto.cloudinary.previewUrl}`);
        console.log(`Thumbnail URL: ${uploadedPhoto.cloudinary.thumbnailUrl}`);
      } else {
        console.log('❌ No Cloudinary data in uploaded photo');
      }
    }
    
    // Step 5: Test photo URLs from API
    console.log('\n5. Testing photo URLs from gallery API...');
    const photosResponse = await axios.get(`${LOCAL_URL}/api/galleries/${galleryId}/photos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (photosResponse.data.photos.length > 0) {
      const photo = photosResponse.data.photos[0];
      console.log(`Photo URLs from API:`);
      console.log(`- previewUrl: ${photo.previewUrl}`);
      console.log(`- thumbnailUrl: ${photo.thumbnailUrl}`);
      console.log(`- url: ${photo.url}`);
      
      // Test if URLs work
      try {
        const previewTest = await axios.head(`${LOCAL_URL}${photo.previewUrl}`);
        console.log(`✅ Preview URL works: ${previewTest.status}`);
      } catch (error) {
        console.log(`❌ Preview URL failed: ${error.response?.status || error.message}`);
      }
    }
    
    console.log('\n🎉 Upload flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUploadFlow();