const https = require('https');
const { parse } = require('url');

// Test photographer credentials
const credentials = {
  email: 'test@photographer.com',
  password: 'password123'
};

async function makeRequest(options, postData = null) {
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
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function extractCsrfToken(html) {
  // Look for CSRF token in various formats
  const patterns = [
    /name="csrfToken"\s+value="([^"]+)"/,
    /"csrfToken"\s*:\s*"([^"]+)"/,
    /<input[^>]*name=["']csrfToken["'][^>]*value=["']([^"']+)["']/,
    /<meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function extractCookies(headers) {
  const cookies = [];
  const setCookieHeaders = headers['set-cookie'] || [];
  
  setCookieHeaders.forEach(cookie => {
    const cookiePart = cookie.split(';')[0];
    cookies.push(cookiePart);
  });
  
  return cookies.join('; ');
}

async function testPhotographerLoginFlow() {
  console.log('🚀 Testing photographer login flow...');
  console.log('📧 Email:', credentials.email);
  console.log('🔑 Password:', credentials.password);
  
  try {
    // Step 1: Get the login page
    console.log('\n📄 Step 1: Getting login page...');
    const loginPageOptions = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/photographer/login',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const loginPageResponse = await makeRequest(loginPageOptions);
    console.log('📊 Login page status:', loginPageResponse.statusCode);
    
    if (loginPageResponse.statusCode !== 200) {
      console.log('❌ Failed to get login page');
      return;
    }
    
    // Extract CSRF token
    const csrfToken = extractCsrfToken(loginPageResponse.data);
    console.log('🔐 CSRF Token:', csrfToken ? 'Found' : 'Not found');
    
    // Extract cookies
    const cookies = extractCookies(loginPageResponse.headers);
    console.log('🍪 Cookies:', cookies ? 'Set' : 'None');
    
    // Step 2: Get CSRF token from NextAuth
    console.log('\n🔐 Step 2: Getting NextAuth CSRF token...');
    const csrfOptions = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies
      }
    };
    
    const csrfResponse = await makeRequest(csrfOptions);
    console.log('📊 CSRF response status:', csrfResponse.statusCode);
    
    let nextAuthCsrfToken = null;
    if (csrfResponse.statusCode === 200) {
      try {
        const csrfData = JSON.parse(csrfResponse.data);
        nextAuthCsrfToken = csrfData.csrfToken;
        console.log('🔐 NextAuth CSRF Token:', nextAuthCsrfToken ? 'Found' : 'Not found');
      } catch (e) {
        console.log('❌ Failed to parse CSRF response');
      }
    }
    
    // Update cookies with CSRF response
    const updatedCookies = extractCookies(csrfResponse.headers);
    const allCookies = cookies + (updatedCookies ? '; ' + updatedCookies : '');
    
    // Step 3: Attempt login via NextAuth credentials provider
    console.log('\n🔑 Step 3: Attempting login...');
    const loginData = {
      email: credentials.email,
      password: credentials.password,
      csrfToken: nextAuthCsrfToken || csrfToken,
      callbackUrl: 'https://www.gallerypavilion.com/photographer/dashboard',
      json: true
    };
    
    const loginPostData = new URLSearchParams(loginData).toString();
    
    const loginOptions = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/signin/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginPostData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': allCookies,
        'Referer': 'https://www.gallerypavilion.com/photographer/login'
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginPostData);
    console.log('📊 Login response status:', loginResponse.statusCode);
    console.log('📋 Login response headers:', JSON.stringify(loginResponse.headers, null, 2));
    
    // Check for redirect or success
    if (loginResponse.statusCode === 302) {
      const location = loginResponse.headers.location;
      console.log('🔄 Redirected to:', location);
      
      if (location && location.includes('dashboard')) {
        console.log('✅ Login successful! Redirected to dashboard.');
        return { success: true, message: 'Login successful' };
      } else if (location && location.includes('error')) {
        console.log('❌ Login failed! Redirected to error page.');
        return { success: false, message: 'Login failed - redirected to error page' };
      } else {
        console.log('🤔 Unexpected redirect location.');
        return { success: false, message: 'Unexpected redirect' };
      }
    } else if (loginResponse.statusCode === 200) {
      console.log('📄 Login response body:', loginResponse.data.substring(0, 500));
      
      if (loginResponse.data.includes('error') || loginResponse.data.includes('invalid')) {
        console.log('❌ Login failed with error message in response.');
        return { success: false, message: 'Login failed with error in response' };
      } else {
        console.log('✅ Login appears successful.');
        return { success: true, message: 'Login successful' };
      }
    } else {
      console.log('❌ Unexpected login response status.');
      console.log('📄 Response body:', loginResponse.data.substring(0, 500));
      return { success: false, message: 'Unexpected response status' };
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
    return { success: false, message: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🎯 FINAL PHOTOGRAPHER LOGIN TEST');
  console.log('='.repeat(60));
  
  const result = await testPhotographerLoginFlow();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULT');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ SUCCESS: Photographer login is working!');
    console.log('📧 Email: test@photographer.com');
    console.log('🔑 Password: password123');
    console.log('🌐 Login URL: https://www.gallerypavilion.com/photographer/login');
  } else {
    console.log('❌ FAILED: Photographer login still has issues');
    console.log('💬 Error:', result.message);
  }
  
  console.log('\n📝 Manual Test Instructions:');
  console.log('1. Open: https://www.gallerypavilion.com/photographer/login');
  console.log('2. Enter email: test@photographer.com');
  console.log('3. Enter password: password123');
  console.log('4. Click Sign In');
  console.log('5. You should be redirected to the photographer dashboard');
}

main();