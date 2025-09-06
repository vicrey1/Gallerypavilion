const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test photographer login with real credentials from seed data
async function testRealPhotographerLogin() {
  console.log('Testing photographer login with real credentials...');
  
  // Real test credentials from seed data
  const testCredentials = {
    email: 'photographer@test.com',
    password: 'password123'
  };
  
  console.log('Using credentials:');
  console.log('Email:', testCredentials.email);
  console.log('Password:', testCredentials.password);
  
  // First, let's check if the database has been seeded
  console.log('\n--- Checking Database ---');
  try {
    const dbCheckResponse = await makeRequest('http://localhost:3001/api/admin/test-auth', {
      method: 'GET'
    });
    console.log(`Database check status: ${dbCheckResponse.statusCode}`);
    if (dbCheckResponse.statusCode === 200) {
      console.log('✅ Database is accessible');
      const data = JSON.parse(dbCheckResponse.data);
      console.log('Admin user exists:', data.success);
    }
  } catch (error) {
    console.log(`❌ Database check error: ${error.message}`);
  }
  
  // Test the photographer login flow step by step
  console.log('\n--- Step 1: Get CSRF Token ---');
  let csrfToken = '';
  try {
    const csrfResponse = await makeRequest('http://localhost:3001/api/auth/csrf', {
      method: 'GET'
    });
    console.log(`CSRF status: ${csrfResponse.statusCode}`);
    if (csrfResponse.statusCode === 200) {
      const csrfData = JSON.parse(csrfResponse.data);
      csrfToken = csrfData.csrfToken;
      console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...');
    }
  } catch (error) {
    console.log(`❌ CSRF error: ${error.message}`);
  }
  
  // Test the actual login
  console.log('\n--- Step 2: Attempt Login ---');
  try {
    const loginResponse = await makeRequest('http://localhost:3001/api/auth/callback/photographer-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfToken}`
      },
      body: `email=${encodeURIComponent(testCredentials.email)}&password=${encodeURIComponent(testCredentials.password)}&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent('http://localhost:3001/dashboard')}&json=true`
    });
    
    console.log(`Login status: ${loginResponse.statusCode}`);
    console.log('Response headers:', JSON.stringify(loginResponse.headers, null, 2));
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Login successful!');
      try {
        const loginData = JSON.parse(loginResponse.data);
        console.log('Login response:', loginData);
      } catch {
        console.log('Response (first 500 chars):', loginResponse.data.substring(0, 500));
      }
    } else if (loginResponse.statusCode === 302 || loginResponse.statusCode === 307) {
      console.log('🔄 Redirect to:', loginResponse.headers.location);
      if (loginResponse.headers.location && loginResponse.headers.location.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard!');
      } else if (loginResponse.headers.location && loginResponse.headers.location.includes('error')) {
        console.log('❌ Login failed - redirected to error page');
      }
    } else {
      console.log('❌ Login failed');
      console.log('Response (first 500 chars):', loginResponse.data.substring(0, 500));
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
  }
  
  // Test production login as well
  console.log('\n--- Step 3: Test Production Login ---');
  try {
    const prodCsrfResponse = await makeRequest('https://www.gallerypavilion.com/api/auth/csrf', {
      method: 'GET'
    });
    
    if (prodCsrfResponse.statusCode === 200) {
      const prodCsrfData = JSON.parse(prodCsrfResponse.data);
      const prodCsrfToken = prodCsrfData.csrfToken;
      console.log('✅ Production CSRF token obtained');
      
      const prodLoginResponse = await makeRequest('https://www.gallerypavilion.com/api/auth/callback/photographer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `next-auth.csrf-token=${prodCsrfToken}`
        },
        body: `email=${encodeURIComponent(testCredentials.email)}&password=${encodeURIComponent(testCredentials.password)}&csrfToken=${prodCsrfToken}&callbackUrl=${encodeURIComponent('https://www.gallerypavilion.com/dashboard')}&json=true`
      });
      
      console.log(`Production login status: ${prodLoginResponse.statusCode}`);
      if (prodLoginResponse.statusCode === 200) {
        console.log('✅ Production login successful!');
      } else if (prodLoginResponse.statusCode === 302 || prodLoginResponse.statusCode === 307) {
        console.log('🔄 Production redirect to:', prodLoginResponse.headers.location);
      } else {
        console.log('❌ Production login failed');
        console.log('Response (first 300 chars):', prodLoginResponse.data.substring(0, 300));
      }
    }
  } catch (error) {
    console.log(`❌ Production login error: ${error.message}`);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    };
    
    const req = lib.request(requestOptions, (res) => {
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
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Run the test
testRealPhotographerLogin().catch(console.error);