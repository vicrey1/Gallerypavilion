const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test photographer login on production vs localhost
async function testProductionPhotographerLogin() {
  console.log('Testing photographer login on production vs localhost...');
  
  const testCredentials = [
    { email: 'vameh09@gmail.com', password: 'password123' },
    { email: 'test@photographer.com', password: 'password123' },
    { email: 'admin@gallerypavilion.com', password: 'admin123' },
    { email: 'photographer@test.com', password: 'password123' }
  ];
  
  for (const credentials of testCredentials) {
    console.log(`\n=== Testing ${credentials.email} ===`);
    
    // Test localhost
    console.log('\n--- Localhost Test ---');
    await testLogin('http://localhost:3001', credentials);
    
    // Test production
    console.log('\n--- Production Test ---');
    await testLogin('https://www.gallerypavilion.com', credentials);
  }
  
  // Also test if production has any photographers at all
  console.log('\n=== Testing Production Database Access ===');
  try {
    const prodResponse = await makeRequest('https://www.gallerypavilion.com/api/debug/env?secret=debug-env-check', {
      method: 'GET'
    });
    
    console.log(`Production debug status: ${prodResponse.statusCode}`);
    if (prodResponse.statusCode === 200) {
      try {
        const debugData = JSON.parse(prodResponse.data);
        console.log('Production environment info:');
        console.log('- NODE_ENV:', debugData.NODE_ENV);
        console.log('- DATABASE_URL:', debugData.DATABASE_URL);
        console.log('- NEXTAUTH_URL:', debugData.NEXTAUTH_URL);
        console.log('- ADMIN_EMAIL:', debugData.ADMIN_EMAIL);
      } catch (error) {
        console.log('Debug response (first 300 chars):', prodResponse.data.substring(0, 300));
      }
    }
  } catch (error) {
    console.log(`❌ Production debug error: ${error.message}`);
  }
}

async function testLogin(baseUrl, credentials) {
  try {
    // Step 1: Get CSRF token
    const csrfResponse = await makeRequest(`${baseUrl}/api/auth/csrf`, {
      method: 'GET'
    });
    
    if (csrfResponse.statusCode !== 200) {
      console.log(`❌ CSRF failed: ${csrfResponse.statusCode}`);
      return;
    }
    
    const csrfData = JSON.parse(csrfResponse.data);
    const csrfToken = csrfData.csrfToken;
    
    // Extract cookies
    let sessionCookies = '';
    const setCookieHeaders = csrfResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      sessionCookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    // Step 2: Attempt login
    const loginResponse = await makeRequest(`${baseUrl}/api/auth/callback/photographer-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookies
      },
      body: `email=${encodeURIComponent(credentials.email)}&password=${encodeURIComponent(credentials.password)}&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent(baseUrl + '/dashboard')}&json=true`
    });
    
    console.log(`Login status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 200) {
      try {
        const loginData = JSON.parse(loginResponse.data);
        console.log('Login response:', loginData);
        
        if (loginData.url && loginData.url.includes('/dashboard')) {
          console.log('✅ Login successful - redirected to dashboard');
        } else if (loginData.url && loginData.url.includes('error')) {
          console.log('❌ Login failed - redirected to error page');
          
          // Try to get the error details
          const errorUrl = new URL(loginData.url, baseUrl);
          const errorParam = errorUrl.searchParams.get('error');
          if (errorParam) {
            console.log('Error details:', decodeURIComponent(errorParam));
          }
        } else {
          console.log('🔄 Unexpected redirect:', loginData.url);
        }
      } catch (error) {
        console.log('Response (first 200 chars):', loginResponse.data.substring(0, 200));
      }
    } else if (loginResponse.statusCode === 302 || loginResponse.statusCode === 307) {
      const location = loginResponse.headers.location;
      console.log('🔄 Redirect to:', location);
      
      if (location && location.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard');
      } else if (location && location.includes('error')) {
        console.log('❌ Login failed - redirected to error page');
        
        // Extract error from redirect URL
        try {
          const errorUrl = new URL(location, baseUrl);
          const errorParam = errorUrl.searchParams.get('error');
          if (errorParam) {
            console.log('Error details:', decodeURIComponent(errorParam));
          }
        } catch (e) {
          console.log('Could not parse error from redirect URL');
        }
      }
    } else {
      console.log('❌ Login failed');
      console.log('Response (first 200 chars):', loginResponse.data.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Login test error: ${error.message}`);
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
testProductionPhotographerLogin().catch(console.error);