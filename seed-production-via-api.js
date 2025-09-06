const https = require('https');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Seeder/1.0'
      }
    };
    
    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createProductionPhotographer() {
  try {
    console.log('🚀 Creating production photographer via API...');
    console.log('Target: https://www.gallerypavilion.com');
    
    // Create photographer user via API
    const photographerData = {
      email: 'test@photographer.com',
      password: 'password123',
      name: 'Test Photographer',
      role: 'PHOTOGRAPHER',
      photographer: {
        businessName: 'Test Photography Studio',
        contactEmail: 'test@photographer.com',
        phone: '+1-555-0123',
        website: 'https://testphotography.com',
        bio: 'Professional photographer for testing purposes',
        specialties: ['Portrait', 'Wedding', 'Event'],
        experience: 5,
        equipment: ['Canon EOS R5', 'Sony A7R IV', 'Professional Lighting'],
        portfolio: ['https://example.com/portfolio1.jpg'],
        status: 'APPROVED',
        pricing: {
          hourlyRate: 150,
          packageDeals: ['Wedding Package: $2000', 'Portrait Session: $300']
        },
        availability: {
          weekdays: true,
          weekends: true,
          evenings: true
        }
      }
    };
    
    console.log('📤 Sending photographer creation request...');
    
    const response = await makeRequest(
      'https://www.gallerypavilion.com/api/seed/photographer?secret=production-seed-2024',
      'POST',
      photographerData
    );
    
    console.log('📥 Response Status:', response.statusCode);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      try {
        const result = JSON.parse(response.data);
        console.log('✅ Photographer created successfully!');
        console.log('📧 Email: test@photographer.com');
        console.log('🔑 Password: password123');
        console.log('👤 User ID:', result.user?.id);
        console.log('📸 Photographer ID:', result.photographer?.id);
        return result;
      } catch (parseError) {
        console.log('✅ Request successful (non-JSON response)');
        console.log('Response:', response.data.substring(0, 200));
      }
    } else {
      console.log('❌ Failed to create photographer');
      console.log('Response:', response.data);
      
      // If it's a 404, the API endpoint might not exist, so let's try a different approach
      if (response.statusCode === 404) {
        console.log('\n🔄 API endpoint not found, trying alternative method...');
        return await createPhotographerViaSignup();
      }
    }
    
  } catch (error) {
    console.error('💥 Error creating photographer:', error.message);
    
    // Try alternative method
    console.log('\n🔄 Trying alternative signup method...');
    return await createPhotographerViaSignup();
  }
}

async function createPhotographerViaSignup() {
  try {
    console.log('\n📝 Attempting photographer signup via registration...');
    
    // First, get the signup page to get CSRF token
    const signupPageResponse = await makeRequest('https://www.gallerypavilion.com/auth/photographer-signup');
    
    if (signupPageResponse.statusCode === 200) {
      console.log('✅ Signup page accessible');
      
      // Try to extract CSRF token (basic approach)
      const csrfMatch = signupPageResponse.data.match(/name="csrfToken"\s+value="([^"]+)"/i);
      const csrfToken = csrfMatch ? csrfMatch[1] : null;
      
      if (csrfToken) {
        console.log('🔐 CSRF token found');
        
        // Attempt signup
        const signupData = {
          csrfToken: csrfToken,
          email: 'test@photographer.com',
          password: 'password123',
          name: 'Test Photographer',
          businessName: 'Test Photography Studio',
          phone: '+1-555-0123',
          website: 'https://testphotography.com',
          bio: 'Professional photographer for testing purposes',
          specialties: 'Portrait, Wedding, Event',
          experience: '5',
          equipment: 'Canon EOS R5, Sony A7R IV, Professional Lighting'
        };
        
        const signupResponse = await makeRequest(
          'https://www.gallerypavilion.com/api/auth/photographer-signup',
          'POST',
          signupData
        );
        
        console.log('📥 Signup Response Status:', signupResponse.statusCode);
        console.log('Response:', signupResponse.data.substring(0, 300));
        
        if (signupResponse.statusCode === 200 || signupResponse.statusCode === 302) {
          console.log('✅ Photographer signup completed!');
          console.log('📧 Email: test@photographer.com');
          console.log('🔑 Password: password123');
          console.log('⚠️  Note: Account may need admin approval');
          return { success: true, method: 'signup' };
        }
      } else {
        console.log('❌ Could not find CSRF token in signup page');
      }
    } else {
      console.log('❌ Signup page not accessible:', signupPageResponse.statusCode);
    }
    
  } catch (error) {
    console.error('💥 Error with signup method:', error.message);
  }
  
  return { success: false };
}

async function testPhotographerLogin() {
  try {
    console.log('\n🧪 Testing photographer login...');
    
    // Get login page for CSRF token
    const loginPageResponse = await makeRequest('https://www.gallerypavilion.com/auth/photographer-login');
    
    if (loginPageResponse.statusCode === 200) {
      const csrfMatch = loginPageResponse.data.match(/name="csrfToken"\s+value="([^"]+)"/i);
      const csrfToken = csrfMatch ? csrfMatch[1] : null;
      
      if (csrfToken) {
        console.log('🔐 CSRF token obtained for login test');
        
        const loginData = {
          csrfToken: csrfToken,
          email: 'test@photographer.com',
          password: 'password123',
          callbackUrl: 'https://www.gallerypavilion.com/photographer/dashboard'
        };
        
        const loginResponse = await makeRequest(
          'https://www.gallerypavilion.com/api/auth/callback/credentials',
          'POST',
          loginData
        );
        
        console.log('📥 Login Test Status:', loginResponse.statusCode);
        
        if (loginResponse.statusCode === 200) {
          console.log('✅ Login successful!');
        } else if (loginResponse.statusCode === 302) {
          const location = loginResponse.headers.location;
          if (location && location.includes('dashboard')) {
            console.log('✅ Login successful (redirected to dashboard)');
          } else if (location && location.includes('error')) {
            console.log('❌ Login failed (redirected to error page)');
            console.log('Redirect URL:', location);
          } else {
            console.log('🔄 Login redirected:', location);
          }
        } else {
          console.log('❌ Login failed');
          console.log('Response:', loginResponse.data.substring(0, 200));
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error testing login:', error.message);
  }
}

async function main() {
  try {
    console.log('🌟 Gallery Pavilion Production Photographer Setup');
    console.log('================================================\n');
    
    const result = await createProductionPhotographer();
    
    // Test the login after creation
    await testPhotographerLogin();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Try logging in at: https://www.gallerypavilion.com/auth/photographer-login');
    console.log('2. Use credentials: test@photographer.com / password123');
    console.log('3. If login still fails, check admin panel for user approval');
    console.log('4. Admin login: https://www.gallerypavilion.com/auth/admin-login');
    
    return result;
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createProductionPhotographer, testPhotographerLogin };