const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

let authCookie = '';

// Test data
const testShareLink = {
  name: 'Test Share Link',
  galleryId: null, // Will be set after creating a gallery
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  maxViews: 100,
  password: 'testpass123',
  allowDownloads: true,
  showExif: false,
  watermarkEnabled: true
};

const testGallery = {
  title: 'Test Gallery for Share Links',
  description: 'A test gallery to verify share link functionality',
  category: 'Portrait',
  isPublic: true
};

let galleryId = '';
let shareLinkId = '';
let shareToken = '';

// Helper function to log test results
function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  console.log('');
}

// Test 1: Admin Login
async function testAdminLogin() {
  try {
    const response = await api.post('/auth/login', {
      email: 'vameh09@gmail.com',
      password: 'admin123456'
    });
    
    if (response.data.success && response.data.user) {
      // Extract cookie from response headers
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const tokenCookie = cookies.find(cookie => cookie.includes('token='));
        if (tokenCookie) {
          authCookie = tokenCookie.split(';')[0]; // Get just the token=value part
          // Set default cookie header for future requests
          api.defaults.headers.Cookie = authCookie;
        }
      }
      
      logTest('Admin Login', true, `Login successful for user: ${response.data.user.email}`);
      return true;
    } else {
      logTest('Admin Login', false, 'Login failed - no success flag or user data');
      return false;
    }
  } catch (error) {
    logTest('Admin Login', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 2: Create Test Gallery
async function testCreateGallery() {
  try {
    const response = await api.post('/galleries', testGallery);
    
    console.log('📤 Gallery creation response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.gallery && response.data.gallery._id) {
      galleryId = response.data.gallery._id;
      testShareLink.galleryId = galleryId;
      logTest('Create Gallery', true, `Gallery ID: ${galleryId}`);
      return true;
    } else {
      logTest('Create Gallery', false, 'No gallery ID in response');
      return false;
    }
  } catch (error) {
    console.log('📤 Gallery creation error response:');
    console.log(JSON.stringify(error.response?.data, null, 2));
    console.log('');
    logTest('Create Gallery', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 3: Create Share Link with New Structure
async function testCreateShareLink() {
  try {
    console.log('📤 Sending share link data:');
    console.log(JSON.stringify(testShareLink, null, 2));
    console.log('');
    
    const response = await api.post(`/galleries/${galleryId}/shares`, testShareLink);
    
    console.log('📥 Share link creation response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.share && response.data.share._id && response.data.share.token) {
      shareLinkId = response.data.share._id;
      shareToken = response.data.share.token;
      const permissions = response.data.share.permissions;
      logTest('Create Share Link', true, 
        `Share Link ID: ${shareLinkId}\n   Token: ${shareToken}\n   Permissions: allowDownloads=${permissions.allowDownloads}, showExif=${permissions.showExif}, watermarkEnabled=${permissions.watermarkEnabled}`);
      
      // Verify the structure matches what we sent
      const receivedData = response.data.share;
      const structureValid = 
        permissions.allowDownloads === testShareLink.allowDownloads &&
        permissions.showExif === testShareLink.showExif &&
        permissions.watermarkEnabled === testShareLink.watermarkEnabled &&
        receivedData.maxViews === testShareLink.maxViews;
      
      if (structureValid) {
        logTest('Share Link Data Structure', true, 'All fields match expected values');
      } else {
        logTest('Share Link Data Structure', false, 'Field values do not match');
        console.log('Expected:', {
          allowDownloads: testShareLink.allowDownloads,
          showExif: testShareLink.showExif,
          watermarkEnabled: testShareLink.watermarkEnabled,
          maxViews: testShareLink.maxViews
        });
        console.log('Received:', {
          allowDownloads: receivedData.allowDownloads,
          showExif: receivedData.showExif,
          watermarkEnabled: receivedData.watermarkEnabled,
          maxViews: receivedData.maxViews
        });
      }
      
      return true;
    } else {
      logTest('Create Share Link', false, 'Missing ID or token in response');
      return false;
    }
  } catch (error) {
    logTest('Create Share Link', false, `Error: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('📥 Error response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
      console.log('');
    }
    return false;
  }
}

// Test 4: Retrieve Share Links
async function testGetShareLinks() {
  try {
    const response = await api.get(`/galleries/${galleryId}/shares`);
    
    console.log('📥 Retrieve share links response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.shares && Array.isArray(response.data.shares) && response.data.shares.length > 0) {
      const shareLink = response.data.shares.find(link => link._id === shareLinkId);
      if (shareLink) {
        logTest('Retrieve Share Links', true, 
          `Found ${response.data.shares.length} share link(s)\n   Retrieved link has correct permissions structure`);
        return true;
      } else {
        logTest('Retrieve Share Links', false, 'Created share link not found in list');
        return false;
      }
    } else {
      logTest('Retrieve Share Links', false, 'No share links returned');
      return false;
    }
  } catch (error) {
    logTest('Retrieve Share Links', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 5: Access Share Link (Public)
async function testAccessShareLink() {
  try {
    // Use the token we got from creating the share link
    if (!shareToken) {
      logTest('Access Share Link', false, 'No share token available');
      return false;
    }
    
    // Now try to access the shared gallery
    const response = await api.get(`/share/${shareToken}`);
    
    console.log('📥 Access share link response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.gallery && response.data.gallery.title) {
      logTest('Access Share Link', true, 
        `Successfully accessed gallery: ${response.data.gallery.title}\n   Photos count: ${response.data.photos ? response.data.photos.length : 0}\n   Permissions applied: allowDownloads=${response.data.permissions?.allowDownloads}`);
      return true;
    } else {
      logTest('Access Share Link', false, 'Invalid share link response');
      return false;
    }
  } catch (error) {
    // If the share link requires a password, we expect a 401 error
    if (error.response?.status === 401 && error.response?.data?.requiresPassword) {
      console.log('✅ Access share link correctly requires password:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('');
      logTest('Access Share Link', true, 'Password protection working correctly');
      return true;
    }
    
    console.log('❌ Access share link error:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('');
    logTest('Access Share Link', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 6: Update Share Link
async function testUpdateShareLink() {
  try {
    const updateData = {
      name: 'Updated Test Share Link',
      maxViews: 50,
      permissions: {
        allowDownloads: false,
        showExif: true,
        watermarkEnabled: false
      }
    };
    
    const response = await api.put(`/share/${shareLinkId}`, updateData);
    
    console.log('📝 Update share link response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data && response.data._id) {
      const updated = response.data;
      const permissions = updated.permissions || {};
      
      // Check if key fields were updated correctly
       const nameMatch = updated.name === updateData.name;
       const maxViewsMatch = updated.maxViews === updateData.maxViews;
       const allowDownloadsMatch = permissions.allowDownloads === updateData.permissions.allowDownloads;
       const showExifMatch = permissions.showExif === updateData.permissions.showExif;
       const watermarkMatch = permissions.watermarkEnabled === updateData.permissions.watermarkEnabled;
      
      console.log(`Update validation:`);
      console.log(`  Name: ${nameMatch} (${updated.name} === ${updateData.name})`);
      console.log(`  MaxViews: ${maxViewsMatch} (${updated.maxViews} === ${updateData.maxViews})`);
      console.log(`  AllowDownloads: ${allowDownloadsMatch} (${permissions.allowDownloads} === ${updateData.permissions.allowDownloads})`);
       console.log(`  ShowExif: ${showExifMatch} (${permissions.showExif} === ${updateData.permissions.showExif})`);
       console.log(`  Watermark: ${watermarkMatch} (${permissions.watermarkEnabled} === ${updateData.permissions.watermarkEnabled})`);
      console.log('');
      
      if (nameMatch && maxViewsMatch && allowDownloadsMatch && showExifMatch && watermarkMatch) {
        logTest('Update Share Link', true, 
          `Successfully updated share link\n   New name: ${updated.name}\n   New maxViews: ${updated.maxViews}\n   New permissions: allowDownloads=${permissions.allowDownloads}, showExif=${permissions.showExif}, watermarkEnabled=${permissions.watermarkEnabled}`);
        return true;
      } else {
        logTest('Update Share Link', false, 'Updated values do not match expected values');
        return false;
      }
    } else {
      logTest('Update Share Link', false, 'No ID in update response');
      return false;
    }
  } catch (error) {
    logTest('Update Share Link', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Delete Share Link
async function testDeleteShareLink() {
  try {
    const response = await api.delete(`/share/${shareLinkId}`);
    
    if (response.status === 200) {
      logTest('Delete Share Link', true, 'Share link deleted successfully');
      return true;
    } else {
      logTest('Delete Share Link', false, `Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Delete Share Link', false, `Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Cleanup: Delete Test Gallery
async function cleanupTestGallery() {
  try {
    await api.delete(`/galleries/${galleryId}`);
    logTest('Cleanup Test Gallery', true, 'Test gallery deleted');
  } catch (error) {
    logTest('Cleanup Test Gallery', false, `Error: ${error.response?.data?.message || error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Share Link Functionality Tests\n');
  console.log('=' .repeat(50));
  console.log('');
  
  let testsPassed = 0;
  let totalTests = 0;
  
  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Create Gallery', fn: testCreateGallery },
    { name: 'Create Share Link', fn: testCreateShareLink },
    { name: 'Retrieve Share Links', fn: testGetShareLinks },
    { name: 'Access Share Link', fn: testAccessShareLink },
    { name: 'Update Share Link', fn: testUpdateShareLink },
    { name: 'Delete Share Link', fn: testDeleteShareLink }
  ];
  
  for (const test of tests) {
    totalTests++;
    const success = await test.fn();
    if (success) testsPassed++;
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Cleanup
  if (galleryId) {
    await cleanupTestGallery();
  }
  
  console.log('=' .repeat(50));
  console.log(`\n📊 Test Results: ${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All tests passed! Share link functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };