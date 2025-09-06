require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Debug CSRF and session issues
async function debugCSRFSessionIssue() {
  console.log('🔍 DEBUGGING CSRF AND SESSION ISSUES');
  console.log('=====================================\n');
  
  const environments = [
    { name: 'Localhost', baseUrl: 'http://localhost:3001' },
    { name: 'Production', baseUrl: 'https://www.gallerypavilion.com' }
  ];
  
  const testCredentials = {
    email: 'vameh09@gmail.com',
    password: 'Cronaldo7'
  };
  
  for (const env of environments) {
    console.log(`\n🌐 TESTING ${env.name.toUpperCase()}`);
    console.log('='.repeat(40));
    
    try {
      // Step 1: Get CSRF token
      console.log('\n1️⃣ Getting CSRF token...');
      const csrfResponse = await makeRequest(`${env.baseUrl}/api/auth/csrf`);
      console.log(`Status: ${csrfResponse.statusCode}`);
      
      if (csrfResponse.statusCode !== 200) {
        console.log('❌ Failed to get CSRF token');
        console.log('Response:', csrfResponse.data);
        continue;
      }
      
      const csrfData = JSON.parse(csrfResponse.data);
      console.log('✅ CSRF token obtained:', csrfData.csrfToken?.substring(0, 20) + '...');
      
      // Step 2: Check signin page
      console.log('\n2️⃣ Checking signin page...');
      const signinResponse = await makeRequest(`${env.baseUrl}/api/auth/signin/photographer-login`);
      console.log(`Signin page status: ${signinResponse.statusCode}`);
      
      // Step 3: Attempt login with proper headers
      console.log('\n3️⃣ Attempting login...');
      const loginData = new URLSearchParams({
        email: testCredentials.email,
        password: testCredentials.password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${env.baseUrl}/dashboard`,
        json: 'true'
      }).toString();
      
      const loginResponse = await makeRequest(
        `${env.baseUrl}/api/auth/callback/photographer-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(loginData),
            'Cookie': csrfResponse.headers['set-cookie']?.join('; ') || '',
            'Origin': env.baseUrl,
            'Referer': `${env.baseUrl}/auth/photographer-login`
          },
          body: loginData
        }
      );
      
      console.log(`Login status: ${loginResponse.statusCode}`);
      console.log('Response headers:', Object.keys(loginResponse.headers));
      
      if (loginResponse.headers['set-cookie']) {
        console.log('Set-Cookie headers:', loginResponse.headers['set-cookie']);
      }
      
      // Parse response
      let responseData;
      try {
        responseData = JSON.parse(loginResponse.data);
        console.log('Response JSON:', responseData);
      } catch (e) {
        console.log('Response (first 300 chars):', loginResponse.data.substring(0, 300));
      }
      
      // Step 4: Check if redirected to error page
      if (responseData?.url && responseData.url.includes('/api/auth/error')) {
        console.log('\n❌ REDIRECTED TO ERROR PAGE');
        const errorUrl = new URL(responseData.url);
        const errorParam = errorUrl.searchParams.get('error');
        console.log('Error:', decodeURIComponent(errorParam || 'Unknown'));
        
        // Get the actual error page
        const errorResponse = await makeRequest(responseData.url);
        console.log('Error page status:', errorResponse.statusCode);
      } else if (responseData?.url && responseData.url.includes('/dashboard')) {
        console.log('\n✅ SUCCESS - REDIRECTED TO DASHBOARD');
        
        // Step 5: Test session
        console.log('\n5️⃣ Testing session...');
        const sessionResponse = await makeRequest(
          `${env.baseUrl}/api/auth/session`,
          {
            headers: {
              'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
            }
          }
        );
        
        console.log(`Session status: ${sessionResponse.statusCode}`);
        if (sessionResponse.statusCode === 200) {
          const sessionData = JSON.parse(sessionResponse.data);
          console.log('Session data:', sessionData);
        }
      } else {
        console.log('\n⚠️ UNEXPECTED RESPONSE');
      }
      
    } catch (error) {
      console.log('❌ Error during test:', error.message);
    }
  }
  
  // Step 6: Check environment variables
  console.log('\n\n🔧 ENVIRONMENT CHECK');
  console.log('====================');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    };
    
    const req = client.request(requestOptions, (res) => {
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

// Run the debug
debugCSRFSessionIssue().catch(console.error);