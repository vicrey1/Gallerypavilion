const https = require('https');

// Check if vameh09@gmail.com exists in production database
async function checkVamehUser() {
  console.log('🔍 Checking user vameh09@gmail.com in production database...');
  console.log('=' .repeat(60));
  
  const targetEmail = 'vameh09@gmail.com';
  
  try {
    // Check production database via API
    console.log('\n1️⃣ Checking if user exists in production...');
    
    const checkUserData = JSON.stringify({
      action: 'check_user',
      email: targetEmail
    });
    
    const options = {
      hostname: 'www.gallerypavilion.com',
      port: 443,
      path: '/api/debug/photographer-auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(checkUserData),
        'User-Agent': 'Debug-Script/1.0'
      }
    };
    
    const response = await makeRequest(options, checkUserData);
    console.log('📊 API Response Status:', response.statusCode);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        console.log('\n📋 USER ANALYSIS:');
        console.log('=' .repeat(40));
        
        if (data.user) {
          console.log('✅ User found in database');
          console.log('📧 Email:', data.user.email);
          console.log('👤 Name:', data.user.name || 'Not set');
          console.log('🔑 Role:', data.user.role);
          console.log('🔐 Has Password:', !!data.user.password);
          console.log('📅 Created:', data.user.createdAt);
          
          if (data.user.photographer) {
            console.log('\n📸 PHOTOGRAPHER PROFILE:');
            console.log('✅ Photographer record exists');
            console.log('🏢 Business Name:', data.user.photographer.businessName || 'Not set');
            console.log('📱 Phone:', data.user.photographer.phone || 'Not set');
            console.log('🌐 Website:', data.user.photographer.website || 'Not set');
            console.log('📊 Status:', data.user.photographer.status);
            console.log('📅 Photographer Created:', data.user.photographer.createdAt);
            
            if (data.user.photographer.status === 'approved') {
              console.log('\n✅ PHOTOGRAPHER STATUS: APPROVED - Should be able to login');
            } else {
              console.log(`\n❌ PHOTOGRAPHER STATUS: ${data.user.photographer.status.toUpperCase()} - Cannot login`);
              console.log('💡 Solution: Photographer needs to be approved by admin');
            }
          } else {
            console.log('\n❌ PHOTOGRAPHER PROFILE: NOT FOUND');
            console.log('💡 Solution: User needs to complete photographer registration');
          }
          
        } else {
          console.log('❌ User not found in database');
          console.log('💡 Solution: User needs to register first');
        }
        
        // Additional checks
        console.log('\n🔍 ADDITIONAL CHECKS:');
        console.log('=' .repeat(40));
        
        if (data.environmentCheck) {
          console.log('🌍 Environment Variables:', data.environmentCheck.status || 'Unknown');
        }
        
        if (data.databaseConnection) {
          console.log('🗄️  Database Connection:', data.databaseConnection.status || 'Unknown');
        }
        
      } catch (parseError) {
        console.log('❌ Error parsing API response:', parseError.message);
        console.log('Raw response:', response.data.substring(0, 500));
      }
    } else {
      console.log('❌ API request failed');
      console.log('Response:', response.data.substring(0, 500));
    }
    
    // Test login attempt
    console.log('\n2️⃣ Testing login attempt...');
    await testLoginAttempt(targetEmail);
    
  } catch (error) {
    console.error('💥 Error during user check:', error.message);
  }
}

// Test login attempt with common passwords
async function testLoginAttempt(email) {
  const commonPasswords = ['password123', 'Password123', '123456', 'password'];
  
  console.log(`🔐 Testing login for ${email} with common passwords...`);
  
  for (const password of commonPasswords) {
    try {
      console.log(`\n   Testing password: ${password}`);
      
      const loginData = new URLSearchParams({
        email: email,
        password: password,
        csrfToken: 'test-token',
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
          'Content-Length': Buffer.byteLength(loginData),
          'User-Agent': 'Debug-Script/1.0'
        }
      };
      
      const response = await makeRequest(options, loginData);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ SUCCESS with password: ${password}`);
        console.log('   📋 Response:', response.data.substring(0, 200));
        break;
      } else if (response.statusCode === 401) {
        console.log(`   ❌ 401 Unauthorized with password: ${password}`);
      } else {
        console.log(`   ⚠️  Status ${response.statusCode} with password: ${password}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error testing password ${password}:`, error.message);
    }
  }
}

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run the check
checkVamehUser().catch(console.error);