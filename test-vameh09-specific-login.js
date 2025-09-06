require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test specific login for vameh09@gmail.com with correct password
async function testVameh09Login() {
  console.log('🧪 Testing vameh09@gmail.com login with correct password...');
  
  const testCredentials = [
    { email: 'vameh09@gmail.com', password: 'Cronaldo7' },
    { email: 'vameh09@gmail.com', password: 'password123' },
    { email: 'vameh09@gmail.com', password: 'admin123' }
  ];
  
  const environments = [
    { name: 'Localhost', baseUrl: 'http://localhost:3001' },
    { name: 'Production', baseUrl: 'https://www.gallerypavilion.com' }
  ];
  
  for (const env of environments) {
    console.log(`\n=== Testing ${env.name} ===`);
    
    for (const creds of testCredentials) {
      console.log(`\n--- Testing password: ${creds.password} ---`);
      
      try {
        // Get CSRF token
        const csrfResponse = await makeRequest(`${env.baseUrl}/api/auth/csrf`);
        const csrfData = JSON.parse(csrfResponse.data);
        const csrfToken = csrfData.csrfToken;
        
        console.log('✅ CSRF token obtained');
        
        // Attempt login
        const loginData = new URLSearchParams({
          email: creds.email,
          password: creds.password,
          csrfToken: csrfToken,
          callbackUrl: `${env.baseUrl}/dashboard`,
          json: 'true'
        }).toString();
        
        const loginResponse = await makeRequest(
          `${env.baseUrl}/api/auth/callback/photographer-login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(loginData)
            },
            body: loginData
          }
        );
        
        console.log(`Login status: ${loginResponse.statusCode}`);
        
        if (loginResponse.statusCode === 200) {
          console.log('✅ Login successful!');
          console.log('Response:', loginResponse.data.substring(0, 200));
        } else {
          console.log('❌ Login failed');
          console.log('Response (first 200 chars):', loginResponse.data.substring(0, 200));
        }
        
      } catch (error) {
        console.log('❌ Error during login test:', error.message);
      }
    }
  }
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
      timeout: 10000
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

// Run the test
testVameh09Login().catch(console.error);