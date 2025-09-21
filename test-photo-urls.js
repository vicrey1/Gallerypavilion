const axios = require('axios');

// Test photo URL endpoints
async function testPhotoUrls() {
  const LOCAL_URL = 'http://localhost:5000';
  
  try {
    console.log('Testing photo URL endpoints...');
    
    // First, get a gallery with photos
    console.log('\n1. Fetching galleries...');
    const galleriesResponse = await axios.get(`${LOCAL_URL}/api/galleries`, {
      timeout: 10000
    });
    
    if (galleriesResponse.data.galleries && galleriesResponse.data.galleries.length > 0) {
      const gallery = galleriesResponse.data.galleries[0];
      console.log(`Found gallery: ${gallery.title} (ID: ${gallery._id})`);
      
      // Get photos from this gallery
      console.log('\n2. Fetching photos from gallery...');
      const photosResponse = await axios.get(`${LOCAL_URL}/api/galleries/${gallery._id}/photos`, {
        timeout: 10000
      });
      
      if (photosResponse.data.photos && photosResponse.data.photos.length > 0) {
        const photo = photosResponse.data.photos[0];
        console.log(`Found photo: ${photo.title} (ID: ${photo._id})`);
        console.log('Photo URLs:');
        console.log(`- previewUrl: ${photo.previewUrl}`);
        console.log(`- thumbnailUrl: ${photo.thumbnailUrl}`);
        console.log(`- url: ${photo.url}`);
        
        // Test if the preview URL works
        console.log('\n3. Testing preview URL...');
        try {
          const previewResponse = await axios.head(`${LOCAL_URL}${photo.previewUrl}`, {
            timeout: 10000
          });
          console.log(`✅ Preview URL works: ${previewResponse.status}`);
          console.log(`Content-Type: ${previewResponse.headers['content-type']}`);
        } catch (previewError) {
          console.log(`❌ Preview URL failed: ${previewError.response?.status || previewError.message}`);
        }
        
        // Test if the thumbnail URL works
        console.log('\n4. Testing thumbnail URL...');
        try {
          const thumbnailResponse = await axios.head(`${LOCAL_URL}${photo.thumbnailUrl}`, {
            timeout: 10000
          });
          console.log(`✅ Thumbnail URL works: ${thumbnailResponse.status}`);
          console.log(`Content-Type: ${thumbnailResponse.headers['content-type']}`);
        } catch (thumbnailError) {
          console.log(`❌ Thumbnail URL failed: ${thumbnailError.response?.status || thumbnailError.message}`);
        }
        
        // Check if photo has Cloudinary data
        console.log('\n5. Checking photo storage data...');
        console.log(`Storage type: ${photo.storageType}`);
        if (photo.cloudinary) {
          console.log('Cloudinary data:');
          console.log(`- publicId: ${photo.cloudinary.publicId}`);
          console.log(`- originalUrl: ${photo.cloudinary.originalUrl}`);
          console.log(`- previewUrl: ${photo.cloudinary.previewUrl}`);
          console.log(`- thumbnailUrl: ${photo.cloudinary.thumbnailUrl}`);
        } else {
          console.log('❌ No Cloudinary data found in photo object');
        }
        
      } else {
        console.log('❌ No photos found in gallery');
      }
    } else {
      console.log('❌ No galleries found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPhotoUrls();