const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test API routes on both localhost and production
async function testApiRoutes() {
  console.log('Testing API routes on localhost and production...');
  
  const tests = [
    {
      name: 'Localhost - Health Check',
      url: 'http://localhost:3001/api/admin/health'
    },
    {
      name: 'Production - Health Check', 
      url: 'https://www.gallerypavilion.com/api/admin/health'
    },
    {
      name: 'Localhost - Invite Validate (GET)',
      url: 'http://localhost:3001/api/invite/validate'
    },
    {
      name: 'Production - Invite Validate (GET)',
      url: 'https://www.gallerypavilion.com/api/invite/validate'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      const response = await makeRequest(test.url);
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response: ${response.data.substring(0, 200)}...`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
  
  // Test POST requests
  const postTests = [
    {
      name: 'Localhost - Invite Validate POST',
      url: 'http://localhost:3001/api/invite/validate',
      body: JSON.stringify({ inviteCode: 'TEST123' })
    },
    {
      name: 'Production - Invite Validate POST',
      url: 'https://www.gallerypavilion.com/api/invite/validate', 
      body: JSON.stringify({ inviteCode: 'TEST123' })
    }
  ];
  
  for (const test of postTests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      const response = await makeRequest(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: test.body
      });
      console.log(`Status: ${response.statusCode}`);
      console.log(`Response: ${response.data}`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
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
testApiRoutes().catch(console.error);