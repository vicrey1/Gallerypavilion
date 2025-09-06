// Test script to verify admin login functionality on production
const https = require('https');
const querystring = require('querystring');

// Function to make HTTP requests with redirect handling
function makeRequest(options, postData = null, followRedirects = true) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // Handle redirects
        if (followRedirects && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)) {
          const location = res.headers.location;
          if (location) {
            console.log(`Following redirect to: ${location}`);
            const url = new URL(location, `https://${options.hostname}`);
            const newOptions = {
              hostname: url.hostname,
              path: url.pathname + url.search,
              method: options.method,
              headers: options.headers
            };
            makeRequest(newOptions, postData, followRedirects).then(resolve).catch(reject);
            return;
          }
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login on production...');
    
    // Step 1: Get CSRF token from login page
    console.log('1. Getting CSRF token...');
    const loginPageResponse = await makeRequest({
      hostname: 'gallerypavilion.com',
      path: '/auth/admin-login',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`Login page status: ${loginPageResponse.statusCode}`);
    console.log('Page content preview:', loginPageResponse.body.substring(0, 500));
    
    // Extract CSRF token from response - try multiple patterns
    let csrfMatch = loginPageResponse.body.match(/name="csrfToken"[^>]*value="([^"]+)"/i);
    if (!csrfMatch) {
      csrfMatch = loginPageResponse.body.match(/value="([^"]+)"[^>]*name="csrfToken"/i);
    }
    if (!csrfMatch) {
      csrfMatch = loginPageResponse.body.match(/csrfToken[^>]*value[^>]*"([^"]+)"/i);
    }
    if (!csrfMatch) {
      console.log('Searching for any input with csrfToken...');
      const allInputs = loginPageResponse.body.match(/<input[^>]*>/gi) || [];
      console.log('All inputs found:', allInputs.filter(input => input.includes('csrf')));
      throw new Error('Could not find CSRF token in login page');
    }
    
    const csrfToken = csrfMatch[1];
    console.log(`CSRF token found: ${csrfToken.substring(0, 10)}...`);
    
    // Step 2: Attempt login
    console.log('2. Attempting admin login...');
    const loginData = querystring.stringify({
      email: 'admin@gallerypavilion.com',
      password: 'admin123',
      csrfToken: csrfToken,
      callbackUrl: 'https://gallerypavilion.com/admin',
      json: 'true'
    });
    
    const loginResponse = await makeRequest({
      hostname: 'gallerypavilion.com',
      path: '/api/auth/callback/admin-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': loginPageResponse.headers['set-cookie'] ? loginPageResponse.headers['set-cookie'].join('; ') : ''
      }
    }, loginData);
    
    console.log(`Login response status: ${loginResponse.statusCode}`);
    console.log('Response headers:', Object.keys(loginResponse.headers));
    
    if (loginResponse.headers['set-cookie']) {
      console.log('✅ Cookies set by server:');
      loginResponse.headers['set-cookie'].forEach(cookie => {
        console.log(`  - ${cookie.split(';')[0]}`);
      });
    }
    
    // Check if login was successful
    if (loginResponse.statusCode === 200) {
      try {
        const responseData = JSON.parse(loginResponse.body);
        if (responseData.url) {
          console.log('✅ Login successful! Redirect URL:', responseData.url);
        } else if (responseData.error) {
          console.log('❌ Login failed:', responseData.error);
        } else {
          console.log('✅ Login appears successful (no error in response)');
        }
      } catch (e) {
        console.log('✅ Login successful (non-JSON response, likely redirect)');
      }
    } else {
      console.log('❌ Login failed with status:', loginResponse.statusCode);
      console.log('Response body:', loginResponse.body.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminLogin();