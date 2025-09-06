const https = require('https');
const { URL } = require('url');

// Test actual production photographer login
async function testProductionLogin() {
  console.log('🔍 Testing production photographer login...');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://www.gallerypavilion.com';
  
  // Test with the actual photographer found in production
  const testCredentials = [
    {
      email: 'vameh09@gmail.com',
      password: 'password123', // Common test password
      name: 'Victor Agapiah (Real Production User)'
    },
    {
      email: 'test@photographer.com',
      password: 'password123',
      name: 'Test Photographer'
    }
  ];
  
  for (const creds of testCredentials) {
    console.log(`\n🔐 Testing login for: ${creds.name}`);
    console.log(`   Email: ${creds.email}`);
    
    // Step 1: Get CSRF token
    const csrfResult = await getCsrfToken(baseUrl);
    if (!csrfResult.success) {
      console.log('❌ Failed to get CSRF token');
      continue;
    }
    
    console.log(`   ✓ CSRF Token: ${csrfResult.token.substring(0, 10)}...`);
    
    // Step 2: Attempt login
    const loginResult = await attemptLogin({
      baseUrl,
      email: creds.email,
      password: creds.password,
      csrfToken: csrfResult.token
    });
    
    console.log(`   Status: ${loginResult.statusCode}`);
    
    if (loginResult.statusCode === 200) {
      console.log('   ✅ Login successful!');
      
      // Check if we got a redirect or session
      if (loginResult.headers.location) {
        console.log(`   🔄 Redirect to: ${loginResult.headers.location}`);
      }
      
      // Check response body for any error messages
      if (loginResult.data.includes('error')) {
        console.log('   ⚠️  Response contains error:');
        console.log('   ', loginResult.data.substring(0, 200));
      }
    } else if (loginResult.statusCode === 401) {
      console.log('   ❌ 401 Unauthorized - Invalid credentials');
      
      // Parse the response to see the exact error
      try {
        if (loginResult.data.includes('invalid email and password')) {
          console.log('   💡 Error: "invalid email and password"');
          console.log('   🔍 This suggests:');
          console.log('      - Password hash mismatch');
          console.log('      - User not found');
          console.log('      - User not approved');
          console.log('      - Database connection issue');
        }
      } catch (e) {
        console.log('   Raw response:', loginResult.data.substring(0, 300));
      }
    } else {
      console.log(`   ❌ Unexpected status: ${loginResult.statusCode}`);
      console.log('   Response:', loginResult.data.substring(0, 200));
    }
  }
  
  // Test password verification directly
  console.log('\n🔍 Testing password verification...');
  await testPasswordVerification(baseUrl, 'vameh09@gmail.com');
}

async function getCsrfToken(baseUrl) {
  const result = await makeRequest({
    url: `${baseUrl}/api/auth/csrf`,
    method: 'GET'
  });
  
  if (result.statusCode === 200) {
    try {
      const data = JSON.parse(result.data);
      return { success: true, token: data.csrfToken };
    } catch (e) {
      return { success: false, error: 'Failed to parse CSRF response' };
    }
  }
  
  return { success: false, error: `CSRF request failed: ${result.statusCode}` };
}

async function attemptLogin({ baseUrl, email, password, csrfToken }) {
  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${baseUrl}/photographer/dashboard`,
    json: 'true'
  }).toString();
  
  return await makeRequest({
    url: `${baseUrl}/api/auth/callback/photographer-login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });
}

async function testPasswordVerification(baseUrl, email) {
  // Test if we can verify the user exists and check their details
  const result = await makeRequest({
    url: `${baseUrl}/api/debug/user?email=${encodeURIComponent(email)}`,
    method: 'GET'
  });
  
  if (result.statusCode === 200) {
    try {
      const data = JSON.parse(result.data);
      if (data.success && data.user) {
        console.log('✅ User found in database:');
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Role: ${data.user.role}`);
        console.log(`   Has password: ${data.user.password ? 'Yes' : 'No'}`);
        
        if (data.user.photographer) {
          console.log(`   Photographer status: ${data.user.photographer.status}`);
          console.log(`   Photographer approved: ${data.user.photographer.status === 'approved' ? 'Yes' : 'No'}`);
        }
        
        // Check password hash format
        if (data.user.password) {
          const passwordHash = data.user.password;
          console.log(`   Password hash length: ${passwordHash.length}`);
          console.log(`   Password hash starts with: ${passwordHash.substring(0, 10)}...`);
          
          // Check if it looks like a bcrypt hash
          if (passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2a$')) {
            console.log('   ✅ Password appears to be properly hashed (bcrypt)');
          } else {
            console.log('   ⚠️  Password hash format might be incorrect');
          }
        }
      } else {
        console.log('❌ User not found in database');
      }
    } catch (e) {
      console.log('❌ Failed to parse user data:', e.message);
    }
  } else {
    console.log(`❌ Failed to fetch user data: ${result.statusCode}`);
  }
}

async function makeRequest({ url, method, headers = {}, body = null }) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Production-Login-Test/1.0',
        ...headers
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testProductionLogin()
    .then(() => {
      console.log('\n🏁 Production login test complete');
      console.log('\n💡 Common solutions for 401 errors:');
      console.log('  1. Reset photographer password in production');
      console.log('  2. Verify environment variables match');
      console.log('  3. Check Vercel function logs for detailed errors');
      console.log('  4. Ensure database connection is stable');
    })
    .catch(console.error);
}

module.exports = { testProductionLogin };