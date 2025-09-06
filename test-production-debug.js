const https = require('https');
const http = require('http');

// Test the production debug endpoint
async function testProductionDebug() {
  console.log('🔍 Testing production debug endpoint...');
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/debug/photographer-login',
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
    
    req.end();
  });
}

// Test with fix action
async function testProductionDebugWithFix() {
  console.log('\n🔧 Testing production debug endpoint with fix action...');
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/debug/photographer-login?action=fix&secret=debug123',
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
        console.log('\n📋 Fix Response:');
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
    
    req.setTimeout(15000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Starting production debug test...');
    console.log('Target: https://www.gallerypavilion.com/api/debug/photographer-login\n');
    
    // First test basic debug info
    await testProductionDebug();
    
    // Then test with fix action
    await testProductionDebugWithFix();
    
    console.log('\n✅ Debug test completed!');
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testProductionDebug, testProductionDebugWithFix };