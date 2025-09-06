const https = require('https');
const { URL } = require('url');

// Test photographer login callback with detailed debugging
async function debugCallbackError() {
  console.log('🔍 DEBUGGING 401 CALLBACK ERROR');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://www.gallerypavilion.com';
  const credentials = {
    email: 'test@photographer.com',
    password: 'password123'
  };
  
  try {
    // Step 1: Get login page and CSRF token
    console.log('\n1️⃣ Getting login page and CSRF token...');
    const loginPageData = await getLoginPage();
    console.log('✅ Login page loaded');
    console.log('🔑 CSRF Token:', loginPageData.csrfToken ? 'Found' : 'Missing');
    
    // Step 2: Test direct authentication endpoint
    console.log('\n2️⃣ Testing authentication endpoint...');
    const authResult = await testAuthentication({
      credentials,
      csrfToken: loginPageData.csrfToken,
      cookies: loginPageData.cookies
    });
    
    console.log('\n📊 AUTHENTICATION RESULT:');
    console.log('Status Code:', authResult.statusCode);
    console.log('Headers:', JSON.stringify(authResult.headers, null, 2));
    console.log('Response:', authResult.body);
    
    if (authResult.statusCode === 401) {
      console.log('\n❌ 401 ERROR ANALYSIS:');
      console.log('This indicates authentication failed. Possible causes:');
      console.log('1. Invalid credentials (email/password)');
      console.log('2. User not found in database');
      console.log('3. Photographer status not "approved"');
      console.log('4. Database connection issues');
      console.log('5. CSRF token validation failure');
      console.log('6. NextAuth configuration issues');
      
      // Step 3: Verify user exists in database
      console.log('\n3️⃣ Verifying user exists in database...');
      await verifyUserInDatabase(credentials.email);
    }
    
  } catch (error) {
    console.error('💥 Error during debugging:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Get login page and extract CSRF token
function getLoginPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/auth/photographer-login',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      const cookies = [];
      
      // Collect cookies
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(cookie => {
          cookies.push(cookie.split(';')[0]);
        });
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Extract CSRF token from HTML
        const csrfMatch = data.match(/name="csrfToken"\s+value="([^"]+)"/i);
        const csrfToken = csrfMatch ? csrfMatch[1] : null;
        
        resolve({
          csrfToken,
          cookies: cookies.join('; '),
          html: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test authentication with detailed error capture
function testAuthentication({ credentials, csrfToken, cookies }) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      email: credentials.email,
      password: credentials.password,
      csrfToken: csrfToken || 'fallback-token',
      callbackUrl: '/photographer/dashboard',
      json: 'true'
    }).toString();
    
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/callback/photographer-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
        'Referer': 'https://www.gallerypavilion.com/auth/photographer-login',
        'Origin': 'https://www.gallerypavilion.com'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data);
        } catch (e) {
          parsedBody = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Verify user exists in database via API
function verifyUserInDatabase(email) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email });
    
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/check-photographer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Debug-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Database Check Status:', res.statusCode);
        
        try {
          const result = JSON.parse(data);
          console.log('📊 Database Check Result:', JSON.stringify(result, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ User exists in database');
            console.log('👤 Photographer Status:', result.status);
            console.log('👤 Photographer Name:', result.name);
          } else {
            console.log('❌ User not found in database or error occurred');
          }
        } catch (e) {
          console.log('📊 Raw response:', data);
        }
        
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Database check error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Database check timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the debug
debugCallbackError().then(() => {
  console.log('\n🏁 Debug completed');
}).catch(error => {
  console.error('💥 Debug failed:', error.message);
});