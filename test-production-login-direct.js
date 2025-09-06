const https = require('https');

// Test the actual photographer login endpoint
async function testPhotographerLogin() {
  console.log('🔍 Testing photographer login endpoint directly...');
  
  const postData = JSON.stringify({
    email: 'test@photographer.com',
    password: 'password123'
  });
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/auth/callback/photographer-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Debug-Script/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📋 Response:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Test NextAuth signin endpoint
async function testNextAuthSignin() {
  console.log('\n🔍 Testing NextAuth signin endpoint...');
  
  const postData = new URLSearchParams({
    email: 'test@photographer.com',
    password: 'password123',
    csrfToken: 'test-token',
    callbackUrl: '/dashboard',
    json: 'true'
  }).toString();
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/auth/signin/photographer-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Debug-Script/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📋 NextAuth Response:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Test if the photographer login page exists
async function testLoginPage() {
  console.log('\n🔍 Testing photographer login page...');
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/auth/photographer-login',
    method: 'GET',
    headers: {
      'User-Agent': 'Debug-Script/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📋 Login Page Response:');
        if (data.includes('photographer') || data.includes('login')) {
          console.log('✅ Login page found and contains expected content');
        } else {
          console.log('❌ Login page may not be working correctly');
          console.log('First 500 chars:', data.substring(0, 500));
        }
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Starting production login test...');
    console.log('Target: https://www.gallerypavilion.com\n');
    
    // Test login page
    await testLoginPage();
    
    // Test NextAuth signin
    await testNextAuthSignin();
    
    // Test direct callback
    await testPhotographerLogin();
    
    console.log('\n✅ Login test completed!');
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPhotographerLogin, testNextAuthSignin, testLoginPage };