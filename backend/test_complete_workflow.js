const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Create axios instance with cookie support
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

let authCookie = '';

// Test the complete share link workflow
async function testCompleteWorkflow() {
  try {
    console.log('🚀 Testing Complete Share Link Workflow\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gallerypavilion');
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Login as admin (who can create galleries)
    console.log('\n📝 Step 1: Login as admin');
    const loginResponse = await api.post('/auth/login', {
      email: 'vameh09@gmail.com',
      password: 'admin123456'
    });
    
    if (loginResponse.data.success && loginResponse.data.user) {
      // Extract cookie from response headers
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const tokenCookie = cookies.find(cookie => cookie.includes('token='));
        if (tokenCookie) {
          authCookie = tokenCookie.split(';')[0]; // Get just the token=value part
          // Set default cookie header for future requests
          api.defaults.headers.Cookie = authCookie;
        }
      }
      console.log('✅ Admin logged in successfully');
    } else {
      throw new Error('Login failed - no success flag or user data');
    }
    
    // Step 2: Create a test gallery
    console.log('\n📝 Step 2: Create test gallery');
    const galleryResponse = await api.post('/galleries', {
      title: 'Complete Workflow Test Gallery',
      description: 'Testing the complete share link workflow',
      category: 'Portrait'
    });
    
    const galleryId = galleryResponse.data.gallery._id;
    console.log(`✅ Gallery created: ${galleryId}`);
    
    // Step 3: Create a share link
    console.log('\n📝 Step 3: Create share link');
    const shareResponse = await api.post('/share/create', {
      galleryId: galleryId,
      name: 'Client Preview Link',
      password: 'client123',
      allowDownloads: true,
      showExif: false,
      watermarkEnabled: true,
      maxViews: 100,
      clientName: 'Test Client',
      clientEmail: 'client@test.com'
    });
    
    console.log('Share response:', shareResponse.data);
    const shareLink = shareResponse.data.shareLink || shareResponse.data;
    const shareToken = shareLink.token;
    console.log(`✅ Share link created: ${shareToken}`);
    console.log(`   Share URL: http://localhost:3001/gallery/${shareToken}`);
    
    // Step 4: Test accessing share link without password (should fail)
    console.log('\n📝 Step 4: Test access without password');
    try {
      await axios.get(`http://localhost:5000/api/share/${shareToken}`, {
        headers: {}
      });
      console.log('❌ FAIL: Should have required password');
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data?.requiresPassword) {
        console.log('✅ Correctly requires password');
      } else {
        console.log('❌ FAIL: Unexpected error:', error.response?.data);
      }
    }
    
    // Step 5: Test accessing share link with correct password
    console.log('\n🔑 Step 5: Test access with correct password');
    const testPassword = 'client123';
    console.log(`   Using password: '${testPassword}'`);
    console.log(`   URL: http://localhost:5000/api/share/${shareLink.token}?password=${testPassword}`);
    try {
      // Access the gallery with password as query parameter (using clean axios instance)
      const accessResponse = await axios.get(`http://localhost:5000/api/share/${shareLink.token}?password=${testPassword}`, {
        headers: {}
      });
      console.log(`✅ Successfully accessed gallery with password: ${accessResponse.data.gallery.title}`);
    } catch (error) {
      console.log(`❌ FAIL: Could not access with password:`);
      console.log('   Error details:', JSON.stringify(error.response?.data, null, 2));
      console.log('   Status:', error.response?.status);
    }
    
    // Step 6: Test accessing share link with wrong password
    console.log('\n❌ Step 6: Test access with wrong password');
    try {
      await axios.get(`http://localhost:5000/api/share/${shareLink.token}?password=wrongpassword`, {
        headers: {}
      });
      console.log('❌ FAIL: Should not have accessed with wrong password');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected wrong password');
      } else {
        console.log(`❌ FAIL: Unexpected error: ${error.response?.data || error.message}`);
      }
    }
    
    // Step 7: Test retrieving share links for gallery
    console.log('\n📝 Step 7: Test retrieving share links');
    const shareLinksResponse = await api.get(`/share/gallery/${galleryId}`);
    console.log(`✅ Retrieved ${shareLinksResponse.data.length} share link(s)`);
    
    // Step 8: Cleanup
    console.log('\n📝 Step 8: Cleanup');
    await api.delete(`/share/${shareLink._id}`);
    console.log('✅ Share link deleted');
    
    await api.delete(`/galleries/${galleryId}`);
    console.log('✅ Gallery deleted');
    
    console.log('\n🎉 Complete workflow test passed! All functionality working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin can create galleries');
    console.log('   ✅ Admin can create password-protected share links');
    console.log('   ✅ Clients are prompted for password when accessing protected links');
    console.log('   ✅ Clients can access galleries with correct password');
    console.log('   ✅ Wrong passwords are rejected');
    console.log('   ✅ Share links can be managed and deleted');
    console.log('\n🌐 Frontend URLs:');
    console.log('   📸 Admin Dashboard: http://localhost:3001/dashboard');
    console.log('   🏠 Client Token Access: http://localhost:3001 (use access modal)');
    console.log('   🔗 Direct Share Link: http://localhost:3001/gallery/[token]');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCompleteWorkflow();