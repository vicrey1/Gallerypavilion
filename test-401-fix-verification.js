const https = require('https');

// Test to verify the 401 callback error is fixed
async function test401Fix() {
  console.log('🔍 Testing 401 callback error fix...');
  console.log('===============================================');
  
  const testCredentials = {
    email: 'test@photographer.com',
    password: 'password123'
  };
  
  try {
    // Step 1: Test the login page loads without errors
    console.log('\n1️⃣ Testing login page access...');
    const loginPageResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      path: '/auth/photographer-login',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`📄 Login page status: ${loginPageResponse.statusCode}`);
    if (loginPageResponse.statusCode === 200) {
      console.log('✅ Login page loads successfully');
    } else {
      console.log('❌ Login page failed to load');
      return;
    }
    
    // Step 2: Test NextAuth CSRF endpoint
    console.log('\n2️⃣ Testing NextAuth CSRF endpoint...');
    const csrfResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`🔐 CSRF endpoint status: ${csrfResponse.statusCode}`);
    let csrfToken = null;
    if (csrfResponse.statusCode === 200) {
      try {
        const csrfData = JSON.parse(csrfResponse.data);
        csrfToken = csrfData.csrfToken;
        console.log('✅ CSRF token obtained successfully');
      } catch (e) {
        console.log('❌ Failed to parse CSRF response');
      }
    }
    
    // Step 3: Test the credentials provider endpoint (the one that was failing)
    console.log('\n3️⃣ Testing credentials provider endpoint...');
    const loginData = {
      email: testCredentials.email,
      password: testCredentials.password,
      csrfToken: csrfToken,
      callbackUrl: 'https://www.gallerypavilion.com/dashboard',
      json: true
    };
    
    const postData = new URLSearchParams(loginData).toString();
    
    const credentialsResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      path: '/api/auth/signin/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': csrfResponse.headers['set-cookie']?.join('; ') || ''
      }
    }, postData);
    
    console.log(`🔑 Credentials endpoint status: ${credentialsResponse.statusCode}`);
    
    if (credentialsResponse.statusCode === 200) {
      console.log('✅ Credentials endpoint working - no 401 error!');
      try {
        const responseData = JSON.parse(credentialsResponse.data);
        console.log('📄 Response:', responseData);
        
        if (responseData.url) {
          if (responseData.url.includes('dashboard')) {
            console.log('🎉 SUCCESS: Login redirects to dashboard!');
          } else if (responseData.url.includes('error')) {
            console.log('⚠️  Login redirects to error page - check credentials');
          } else {
            console.log(`🔄 Login redirects to: ${responseData.url}`);
          }
        }
      } catch (e) {
        console.log('📄 Response (non-JSON):', credentialsResponse.data.substring(0, 200));
      }
    } else if (credentialsResponse.statusCode === 401) {
      console.log('❌ 401 ERROR STILL EXISTS!');
      console.log('Response:', credentialsResponse.data);
    } else {
      console.log(`📊 Unexpected status: ${credentialsResponse.statusCode}`);
      console.log('Response:', credentialsResponse.data.substring(0, 200));
    }
    
    // Step 4: Test the callback endpoint that was originally failing
    console.log('\n4️⃣ Testing callback endpoint (original error source)...');
    const callbackResponse = await makeRequest({
      hostname: 'www.gallerypavilion.com',
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': csrfResponse.headers['set-cookie']?.join('; ') || ''
      }
    }, postData);
    
    console.log(`🔄 Callback endpoint status: ${callbackResponse.statusCode}`);
    
    if (callbackResponse.statusCode === 401) {
      console.log('❌ 401 ERROR STILL EXISTS in callback!');
    } else {
      console.log('✅ Callback endpoint no longer returns 401!');
    }
    
    console.log('\n===============================================');
    console.log('🎯 SUMMARY:');
    console.log('===============================================');
    console.log(`Login Page: ${loginPageResponse.statusCode === 200 ? '✅ Working' : '❌ Failed'}`);
    console.log(`CSRF Token: ${csrfToken ? '✅ Working' : '❌ Failed'}`);
    console.log(`Credentials: ${credentialsResponse.statusCode === 200 ? '✅ Working' : '❌ Failed'}`);
    console.log(`Callback: ${callbackResponse.statusCode !== 401 ? '✅ No 401' : '❌ Still 401'}`);
    
    if (credentialsResponse.statusCode === 200 && callbackResponse.statusCode !== 401) {
      console.log('\n🎉 SUCCESS: The 401 callback error has been FIXED!');
      console.log('\n📝 Test the fix manually:');
      console.log('1. Go to: https://www.gallerypavilion.com/auth/photographer-login');
      console.log('2. Enter email: test@photographer.com');
      console.log('3. Enter password: password123');
      console.log('4. Click Sign In');
      console.log('5. You should be redirected to the dashboard without any 401 errors');
    } else {
      console.log('\n❌ The 401 error may still exist. Check the responses above.');
    }
    
  } catch (error) {
    console.error('💥 Error during testing:', error.message);
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
    req.setTimeout(10000, () => {
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
test401Fix().catch(console.error);