const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test photographer login on both localhost and production
async function testPhotographerLogin() {
  console.log('Testing photographer login flow...');
  
  // Test data - using a test photographer account
  const testCredentials = {
    email: 'test@photographer.com',
    password: 'testpassword123'
  };
  
  const tests = [
    {
      name: 'Localhost - Photographer Login Page',
      url: 'http://localhost:3001/auth/photographer-login',
      method: 'GET'
    },
    {
      name: 'Production - Photographer Login Page',
      url: 'https://www.gallerypavilion.com/auth/photographer-login',
      method: 'GET'
    },
    {
      name: 'Localhost - NextAuth Signin API',
      url: 'http://localhost:3001/api/auth/signin/photographer-login',
      method: 'GET'
    },
    {
      name: 'Production - NextAuth Signin API',
      url: 'https://www.gallerypavilion.com/api/auth/signin/photographer-login',
      method: 'GET'
    },
    {
      name: 'Localhost - NextAuth Callback',
      url: 'http://localhost:3001/api/auth/callback/photographer-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `email=${encodeURIComponent(testCredentials.email)}&password=${encodeURIComponent(testCredentials.password)}&csrfToken=test`
    },
    {
      name: 'Production - NextAuth Callback',
      url: 'https://www.gallerypavilion.com/api/auth/callback/photographer-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `email=${encodeURIComponent(testCredentials.email)}&password=${encodeURIComponent(testCredentials.password)}&csrfToken=test`
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      const response = await makeRequest(test.url, {
        method: test.method || 'GET',
        headers: test.headers || {},
        body: test.body
      });
      console.log(`Status: ${response.statusCode}`);
      
      // Show relevant parts of the response
      if (response.statusCode === 200) {
        console.log('✅ Request successful');
        if (response.data.includes('photographer-login') || response.data.includes('Photographer Login')) {
          console.log('✅ Contains photographer login content');
        }
      } else if (response.statusCode === 302 || response.statusCode === 307) {
        console.log(`🔄 Redirect to: ${response.headers.location || 'Unknown'}`);
      } else {
        console.log(`❌ Error response`);
        console.log(`Response preview: ${response.data.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test if there are any photographers in the database
  console.log('\n--- Testing Database Connection ---');
  try {
    const dbTestResponse = await makeRequest('http://localhost:3001/api/admin/photographers', {
      method: 'GET'
    });
    console.log(`Database test status: ${dbTestResponse.statusCode}`);
    if (dbTestResponse.statusCode === 401) {
      console.log('✅ API is working (requires admin auth as expected)');
    }
  } catch (error) {
    console.log(`❌ Database test error: ${error.message}`);
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
      timeout: 10000
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
testPhotographerLogin().catch(console.error);