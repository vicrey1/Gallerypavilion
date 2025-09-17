const axios = require('axios');

// Test photo URL construction and access
async function testPhotoUrls() {
  console.log('🔍 Testing Photo URL Construction and Access...');
  
  const photoId = '68c85a2ce1ede37536a2748a';
  const baseURL = 'http://localhost:5000';
  
  // Test URL construction
  const previewUrl = `/photos/${photoId}/preview`;
  const thumbnailUrl = `/photos/${photoId}/thumbnail`;
  const downloadUrl = `/photos/${photoId}/download`;
  
  console.log('\n📋 URL Construction:');
  console.log('Preview URL:', previewUrl);
  console.log('Thumbnail URL:', thumbnailUrl);
  console.log('Download URL:', downloadUrl);
  console.log('Full Preview URL:', baseURL + previewUrl);
  
  // Test direct access to photo endpoints
  console.log('\n🌐 Testing Direct Access:');
  
  try {
    console.log('Testing preview endpoint...');
    const previewResponse = await axios.get(baseURL + previewUrl, {
      validateStatus: () => true // Don't throw on non-2xx status
    });
    console.log('Preview Response:', previewResponse.status, previewResponse.statusText);
    if (previewResponse.status !== 200) {
      console.log('Preview Error:', previewResponse.data);
    }
  } catch (error) {
    console.log('Preview Error:', error.message);
  }
  
  try {
    console.log('Testing thumbnail endpoint...');
    const thumbnailResponse = await axios.get(baseURL + thumbnailUrl, {
      validateStatus: () => true
    });
    console.log('Thumbnail Response:', thumbnailResponse.status, thumbnailResponse.statusText);
    if (thumbnailResponse.status !== 200) {
      console.log('Thumbnail Error:', thumbnailResponse.data);
    }
  } catch (error) {
    console.log('Thumbnail Error:', error.message);
  }
  
  // Test with API prefix (how frontend would access)
  console.log('\n🔗 Testing with /api prefix (frontend style):');
  const apiPreviewUrl = `/api${previewUrl}`;
  const apiThumbnailUrl = `/api${thumbnailUrl}`;
  
  console.log('API Preview URL:', apiPreviewUrl);
  console.log('API Thumbnail URL:', apiThumbnailUrl);
  
  try {
    console.log('Testing API preview endpoint...');
    const apiPreviewResponse = await axios.get(baseURL + apiPreviewUrl, {
      validateStatus: () => true
    });
    console.log('API Preview Response:', apiPreviewResponse.status, apiPreviewResponse.statusText);
    if (apiPreviewResponse.status !== 200) {
      console.log('API Preview Error:', apiPreviewResponse.data);
    }
  } catch (error) {
    console.log('API Preview Error:', error.message);
  }
}

testPhotoUrls().catch(console.error);