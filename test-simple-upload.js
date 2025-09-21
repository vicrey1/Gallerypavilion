const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Simple test to check if new uploads use Cloudinary
async function testSimpleUpload() {
  const LOCAL_URL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing simple upload without auth...');
    
    // First, let's check what galleries exist
    console.log('\n1. Checking available galleries...');
    const galleriesResponse = await axios.get(`${LOCAL_URL}/api/galleries`);
    
    if (galleriesResponse.data.galleries && galleriesResponse.data.galleries.length > 0) {
      const gallery = galleriesResponse.data.galleries[0];
      console.log(`Found gallery: ${gallery.title} (ID: ${gallery._id})`);
      
      // Check photos in this gallery
      console.log('\n2. Checking photos in gallery...');
      const photosResponse = await axios.get(`${LOCAL_URL}/api/galleries/${gallery._id}/photos`);
      
      if (photosResponse.data.photos && photosResponse.data.photos.length > 0) {
        console.log(`Found ${photosResponse.data.photos.length} photos`);
        
        // Check the most recent photo
        const recentPhoto = photosResponse.data.photos[0];
        console.log('\n3. Checking most recent photo...');
        console.log(`Photo: ${recentPhoto.title}`);
        console.log(`Storage Type: ${recentPhoto.storageType || 'undefined'}`);
        
        // Test the photo URLs
        console.log('\n4. Testing photo URLs...');
        if (recentPhoto.previewUrl) {
          try {
            const previewTest = await axios.head(`${LOCAL_URL}${recentPhoto.previewUrl}`);
            console.log(`✅ Preview URL works: ${previewTest.status}`);
            console.log(`Content-Type: ${previewTest.headers['content-type']}`);
          } catch (error) {
            console.log(`❌ Preview URL failed: ${error.response?.status || error.message}`);
          }
        }
        
        if (recentPhoto.thumbnailUrl) {
          try {
            const thumbnailTest = await axios.head(`${LOCAL_URL}${recentPhoto.thumbnailUrl}`);
            console.log(`✅ Thumbnail URL works: ${thumbnailTest.status}`);
            console.log(`Content-Type: ${thumbnailTest.headers['content-type']}`);
          } catch (error) {
            console.log(`❌ Thumbnail URL failed: ${error.response?.status || error.message}`);
          }
        }
        
        // Check if this photo has Cloudinary data by fetching full details
        console.log('\n5. Checking photo storage details...');
        try {
          const photoDetailResponse = await axios.get(`${LOCAL_URL}/api/photos/${recentPhoto._id}`);
          const photoDetail = photoDetailResponse.data;
          
          console.log(`Storage Type: ${photoDetail.storageType || 'undefined'}`);
          if (photoDetail.cloudinary) {
            console.log('☁️ Cloudinary data found:');
            console.log(`- Public ID: ${photoDetail.cloudinary.publicId}`);
            console.log(`- Original URL: ${photoDetail.cloudinary.originalUrl}`);
            console.log(`- Preview URL: ${photoDetail.cloudinary.previewUrl}`);
            console.log(`- Thumbnail URL: ${photoDetail.cloudinary.thumbnailUrl}`);
          } else {
            console.log('❌ No Cloudinary data found');
          }
        } catch (error) {
          console.log(`❌ Could not fetch photo details: ${error.response?.status || error.message}`);
        }
        
      } else {
        console.log('❌ No photos found in gallery');
      }
    } else {
      console.log('❌ No galleries found');
    }
    
    console.log('\n🎉 Simple upload test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSimpleUpload();