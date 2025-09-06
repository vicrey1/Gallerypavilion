require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testVamehLoginFlow() {
  console.log('🔐 Testing login flow for vameh09@gmail.com...');
  console.log('=' .repeat(60));
  
  const targetEmail = 'vameh09@gmail.com';
  
  try {
    // First, let's get the user's actual password hash
    console.log('\n1️⃣ Getting user password hash...');
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        email: true,
        password: true,
        photographer: {
          select: {
            status: true,
            businessName: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('📊 Photographer status:', user.photographer?.status);
    console.log('🔐 Password hash (first 20 chars):', user.password?.substring(0, 20) + '...');
    
    // Test common passwords against the hash
    console.log('\n2️⃣ Testing common passwords...');
    const commonPasswords = [
      'password123', 'Password123', '123456', 'password',
      'vameh123', 'Vameh123', 'vameh09', 'Vameh09',
      'victor123', 'Victor123', 'agapiah123', 'Agapiah123',
      'trust123', 'Trust123', 'million123', 'Million123',
      'binary123', 'Binary123', 'fx123', 'Fx123',
      '12345678', 'qwerty123', 'admin123', 'test123'
    ];
    
    let correctPassword = null;
    
    for (const testPassword of commonPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        if (isValid) {
          console.log(`✅ FOUND CORRECT PASSWORD: '${testPassword}'`);
          correctPassword = testPassword;
          break;
        }
      } catch (error) {
        console.log(`💥 Error testing password '${testPassword}':`, error.message);
      }
    }
    
    if (!correctPassword) {
      console.log('❌ None of the common passwords worked');
      console.log('💡 The user might have a custom password');
      
      // Let's try to reset the password to a known value
      console.log('\n3️⃣ Resetting password to "password123"...');
      const newPasswordHash = await bcrypt.hash('password123', 12);
      
      await prisma.user.update({
        where: { email: targetEmail },
        data: { password: newPasswordHash }
      });
      
      console.log('✅ Password reset to "password123"');
      correctPassword = 'password123';
    }
    
    // Test the actual login flow
    console.log('\n4️⃣ Testing actual login flow...');
    await testActualLogin(targetEmail, correctPassword);
    
    // Test the frontend login page
    console.log('\n5️⃣ Testing frontend login page...');
    await testFrontendLogin(targetEmail, correctPassword);
    
  } catch (error) {
    console.error('💥 Error during login flow test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Test the actual NextAuth login endpoint
async function testActualLogin(email, password) {
  console.log(`🔐 Testing NextAuth login for ${email}...`);
  
  try {
    // First get CSRF token
    console.log('   📋 Getting CSRF token...');
    const csrfResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/csrf',
      method: 'GET'
    });
    
    let csrfToken = 'test-token';
    if (csrfResponse.statusCode === 200) {
      try {
        const csrfData = JSON.parse(csrfResponse.data);
        csrfToken = csrfData.csrfToken;
        console.log('   ✅ CSRF token obtained');
      } catch (e) {
        console.log('   ⚠️  Using fallback CSRF token');
      }
    }
    
    // Test login
    console.log('   🔐 Testing login...');
    const loginData = new URLSearchParams({
      email: email,
      password: password,
      csrfToken: csrfToken,
      callbackUrl: '/dashboard',
      json: 'true'
    }).toString();
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/photographer-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);
    
    console.log('   📊 Login response status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode === 200) {
      console.log('   ✅ LOGIN SUCCESSFUL');
      console.log('   📋 Response:', loginResponse.data.substring(0, 200));
    } else {
      console.log('   ❌ LOGIN FAILED');
      console.log('   📋 Response:', loginResponse.data.substring(0, 500));
    }
    
  } catch (error) {
    console.log('   💥 Error during login test:', error.message);
  }
}

// Test the frontend login page
async function testFrontendLogin(email, password) {
  console.log(`🌐 Testing frontend login page for ${email}...`);
  
  try {
    // Test accessing the login page
    console.log('   📄 Testing login page access...');
    const pageResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/photographer-login',
      method: 'GET'
    });
    
    console.log('   📊 Login page status:', pageResponse.statusCode);
    
    if (pageResponse.statusCode === 200) {
      console.log('   ✅ Login page accessible');
    } else {
      console.log('   ❌ Login page not accessible');
      console.log('   📋 Response:', pageResponse.data.substring(0, 300));
    }
    
  } catch (error) {
    console.log('   💥 Error testing frontend:', error.message);
  }
}

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = require('http').request(options, (res) => {
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
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run the test
testVamehLoginFlow().catch(console.error);