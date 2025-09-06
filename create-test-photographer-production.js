const https = require('https');

// Test photographer data
const testPhotographer = {
  firstName: 'Test',
  lastName: 'Photographer',
  email: 'test@photographer.com',
  password: 'password123',
  phone: '+1234567890',
  website: 'https://testphotographer.com',
  portfolio: 'https://portfolio.testphotographer.com',
  experience: '5+ years',
  specialization: 'Wedding Photography',
  businessName: 'Test Photography Studio',
  bio: 'Professional test photographer for debugging purposes',
  instagram: '@testphotographer',
  equipment: 'Canon EOS R5, Sony A7R IV',
  references: 'Available upon request'
};

async function createTestPhotographer() {
  console.log('🚀 Creating test photographer in production...');
  console.log('📧 Email:', testPhotographer.email);
  console.log('🔑 Password:', testPhotographer.password);
  
  const postData = JSON.stringify(testPhotographer);
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/auth/photographer-signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Test-Script/1.0'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const response = JSON.parse(data);
          console.log('📄 Response Body:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 201) {
            console.log('✅ Test photographer created successfully!');
            console.log('👤 Photographer ID:', response.photographer?.id);
            console.log('📧 Email:', response.photographer?.email);
            console.log('📊 Status:', response.photographer?.status);
          } else if (res.statusCode === 400 && response.error?.includes('already exists')) {
            console.log('ℹ️ Test photographer already exists - this is fine!');
          } else {
            console.log('❌ Failed to create photographer:', response.error || 'Unknown error');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response:', parseError.message);
          console.log('📄 Raw response:', data);
        }
        
        resolve({ statusCode: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testPhotographerLogin() {
  console.log('\n🔐 Testing photographer login...');
  
  const loginData = JSON.stringify({
    email: testPhotographer.email,
    password: testPhotographer.password
  });
  
  const options = {
    hostname: 'www.gallerypavilion.com',
    port: 443,
    path: '/api/auth/signin/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'User-Agent': 'Test-Script/1.0'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Login Response Status:', res.statusCode);
        console.log('📋 Login Response Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const response = JSON.parse(data);
          console.log('📄 Login Response Body:', JSON.stringify(response, null, 2));
        } catch (parseError) {
          console.log('📄 Raw login response:', data);
        }
        
        resolve({ statusCode: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Login request error:', error.message);
      reject(error);
    });
    
    req.write(loginData);
    req.end();
  });
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('🎯 PRODUCTION PHOTOGRAPHER CREATION & TEST');
    console.log('='.repeat(60));
    
    // Create the photographer
    await createTestPhotographer();
    
    // Test login
    await testPhotographerLogin();
    
    console.log('\n✅ Test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Try logging in at: https://www.gallerypavilion.com/photographer/login');
    console.log('2. Use email:', testPhotographer.email);
    console.log('3. Use password:', testPhotographer.password);
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
  }
}

main();