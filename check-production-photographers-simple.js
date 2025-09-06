const https = require('https');

// Simple test to check if we can access any public API endpoints
async function testPublicEndpoints() {
  console.log('🔍 Testing public API endpoints...');
  
  const endpoints = [
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/csrf'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'Debug-Script/1.0'
      }
    };

    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
      
      console.log(`Status: ${response.status}`);
      
      try {
        const jsonData = JSON.parse(response.data);
        console.log('Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Raw response:', response.data.substring(0, 200));
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error.message);
    }
  }
}

// Test the signin page to see what providers are available
async function testSigninPage() {
  console.log('\n🔍 Testing signin page...');
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/auth/signin',
    method: 'GET',
    headers: {
      'User-Agent': 'Debug-Script/1.0'
    }
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.data.includes('photographer-login')) {
      console.log('✅ Photographer login provider found in signin page');
    } else {
      console.log('❌ Photographer login provider NOT found in signin page');
    }
    
    if (response.data.includes('admin-login')) {
      console.log('✅ Admin login provider found in signin page');
    } else {
      console.log('❌ Admin login provider NOT found in signin page');
    }
    
    if (response.data.includes('invite-code')) {
      console.log('✅ Invite code provider found in signin page');
    } else {
      console.log('❌ Invite code provider NOT found in signin page');
    }
    
    // Show first 500 characters to see what's there
    console.log('\nFirst 500 chars of signin page:');
    console.log(response.data.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Error testing signin page:', error.message);
  }
}

// Test with a real photographer login attempt
async function testPhotographerLoginAttempt() {
  console.log('\n🔍 Testing photographer login attempt...');
  
  // First get CSRF token
  const csrfResponse = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'User-Agent': 'Debug-Script/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData.csrfToken);
        } catch (e) {
          reject(new Error('Failed to parse CSRF token'));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('CSRF request timeout'));
    });
    req.end();
  });
  
  console.log('Got CSRF token:', csrfResponse ? 'YES' : 'NO');
  
  // Now try to login
  const postData = new URLSearchParams({
    email: 'test@photographer.com',
    password: 'password123',
    csrfToken: csrfResponse,
    callbackUrl: '/dashboard',
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
      'User-Agent': 'Debug-Script/1.0'
    }
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });
    
    console.log(`Login attempt status: ${response.status}`);
    console.log('Response headers:', response.headers);
    
    try {
      const jsonData = JSON.parse(response.data);
      console.log('Login response:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Raw login response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error during login attempt:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive production test...');
    console.log('Target: https://www.gallerypavilion.com\n');
    
    await testPublicEndpoints();
    await testSigninPage();
    await testPhotographerLoginAttempt();
    
    console.log('\n✅ Comprehensive test completed!');
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPublicEndpoints, testSigninPage, testPhotographerLoginAttempt };