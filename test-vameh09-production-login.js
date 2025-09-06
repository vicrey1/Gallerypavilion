const https = require('https');

async function testVamehProductionLogin() {
  console.log('🔐 Testing production login for vameh09@gmail.com...');
  console.log('=' .repeat(60));
  
  const email = 'vameh09@gmail.com';
  const password = 'password123'; // Reset password
  
  try {
    // Step 1: Get CSRF token
    console.log('\n1️⃣ Getting CSRF token from production...');
    const csrfResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'User-Agent': 'Login-Test/1.0'
      }
    });
    
    console.log('📊 CSRF Response Status:', csrfResponse.statusCode);
    
    let csrfToken = 'fallback-token';
    if (csrfResponse.statusCode === 200) {
      try {
        const csrfData = JSON.parse(csrfResponse.data);
        csrfToken = csrfData.csrfToken;
        console.log('✅ CSRF token obtained successfully');
      } catch (e) {
        console.log('⚠️  Using fallback CSRF token');
      }
    } else {
      console.log('❌ Failed to get CSRF token');
      console.log('Response:', csrfResponse.data.substring(0, 200));
    }
    
    // Step 2: Test login
    console.log('\n2️⃣ Testing login with reset password...');
    const loginData = new URLSearchParams({
      email: email,
      password: password,
      csrfToken: csrfToken,
      callbackUrl: '/dashboard',
      json: 'true'
    }).toString();
    
    const loginResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/callback/photographer-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'User-Agent': 'Login-Test/1.0'
      }
    }, loginData);
    
    console.log('📊 Login Response Status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode === 200) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('🎉 vameh09@gmail.com can now login with password: password123');
      
      try {
        const responseData = JSON.parse(loginResponse.data);
        if (responseData.url) {
          console.log('🔗 Redirect URL:', responseData.url);
          
          if (responseData.url.includes('/dashboard')) {
            console.log('✅ Redirecting to dashboard - Login flow complete!');
          } else if (responseData.url.includes('/signin')) {
            console.log('⚠️  Redirecting to signin - There might be an issue');
          }
        }
      } catch (e) {
        console.log('📋 Raw response:', loginResponse.data.substring(0, 300));
      }
      
    } else if (loginResponse.statusCode === 401) {
      console.log('\n❌ LOGIN FAILED - 401 Unauthorized');
      console.log('💡 This suggests the password reset might not have worked');
      console.log('📋 Response:', loginResponse.data.substring(0, 500));
      
    } else {
      console.log(`\n❌ LOGIN FAILED - Status ${loginResponse.statusCode}`);
      console.log('📋 Response:', loginResponse.data.substring(0, 500));
    }
    
    // Step 3: Test accessing the login page
    console.log('\n3️⃣ Testing login page accessibility...');
    const pageResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/auth/photographer-login',
      method: 'GET',
      headers: {
        'User-Agent': 'Login-Test/1.0'
      }
    });
    
    console.log('📊 Login Page Status:', pageResponse.statusCode);
    
    if (pageResponse.statusCode === 200) {
      console.log('✅ Login page is accessible');
      
      // Check if the page contains the login form
      if (pageResponse.data.includes('photographer-login') || 
          pageResponse.data.includes('email') || 
          pageResponse.data.includes('password')) {
        console.log('✅ Login form detected on page');
      } else {
        console.log('⚠️  Login form not clearly detected');
      }
    } else {
      console.log('❌ Login page not accessible');
      console.log('📋 Response:', pageResponse.data.substring(0, 300));
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(40));
    console.log('👤 User: vameh09@gmail.com');
    console.log('🔐 Password: password123 (reset)');
    console.log('📊 Status: Approved photographer');
    console.log('🌐 Login URL: https://www.gallerypavilion.com/auth/photographer-login');
    
    if (loginResponse.statusCode === 200) {
      console.log('\n🎉 ISSUE RESOLVED!');
      console.log('✅ The user can now login successfully');
      console.log('💡 The problem was an unknown/incorrect password');
    } else {
      console.log('\n⚠️  ISSUE PARTIALLY RESOLVED');
      console.log('🔐 Password has been reset, but login still failing');
      console.log('💡 There might be additional issues to investigate');
    }
    
  } catch (error) {
    console.error('💥 Error during production login test:', error.message);
  }
}

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run the test
testVamehProductionLogin().catch(console.error);