require('dotenv').config({ path: '.env.local' })
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test photographer login with actual credentials from database
async function testActualPhotographerLogin() {
  console.log('Testing photographer login with actual database credentials...');
  
  // First, get the actual photographer from database
  console.log('\n--- Getting Photographer from Database ---');
  try {
    const photographers = await prisma.photographer.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    console.log(`Found ${photographers.length} photographers:`);
    photographers.forEach(p => {
      console.log(`- ID: ${p.id}, Email: ${p.user.email}, Status: ${p.status}`);
    })
    
    if (photographers.length === 0) {
      console.log('❌ No photographers found in database!');
      return;
    }
    
    const photographer = photographers[0];
    const testEmail = photographer.user.email;
    
    console.log(`\nUsing photographer email: ${testEmail}`);
    console.log('Note: We cannot test the actual password since it\'s hashed in the database.');
    
    // Test with a common password that might have been used
    const possiblePasswords = ['password123', 'admin123', 'test123', '123456'];
    
    for (const password of possiblePasswords) {
      console.log(`\n--- Testing with password: ${password} ---`);
      
      try {
        // Get CSRF token
        const csrfResponse = await makeRequest('http://localhost:3001/api/auth/csrf', {
          method: 'GET'
        });
        
        if (csrfResponse.statusCode !== 200) {
          console.log(`❌ Failed to get CSRF token: ${csrfResponse.statusCode}`);
          continue;
        }
        
        const csrfData = JSON.parse(csrfResponse.data);
        const csrfToken = csrfData.csrfToken;
        
        // Attempt login
        const loginResponse = await makeRequest('http://localhost:3001/api/auth/callback/photographer-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `next-auth.csrf-token=${csrfToken}`
          },
          body: `email=${encodeURIComponent(testEmail)}&password=${encodeURIComponent(password)}&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent('http://localhost:3001/dashboard')}&json=true`
        });
        
        console.log(`Login status: ${loginResponse.statusCode}`);
        
        if (loginResponse.statusCode === 200) {
          try {
            const loginData = JSON.parse(loginResponse.data);
            console.log('Login response:', loginData);
            
            if (loginData.url && !loginData.url.includes('error')) {
              console.log(`✅ Login successful with password: ${password}`);
              break;
            } else if (loginData.url && loginData.url.includes('error')) {
              console.log(`❌ Login failed - redirected to error page`);
            }
          } catch {
            console.log('Response (first 200 chars):', loginResponse.data.substring(0, 200));
          }
        } else if (loginResponse.statusCode === 302 || loginResponse.statusCode === 307) {
          const location = loginResponse.headers.location;
          console.log('🔄 Redirect to:', location);
          
          if (location && location.includes('/dashboard')) {
            console.log(`✅ Login successful with password: ${password} - redirected to dashboard!`);
            break;
          } else if (location && location.includes('error')) {
            console.log(`❌ Login failed with password: ${password} - redirected to error page`);
          }
        } else {
          console.log(`❌ Login failed with password: ${password}`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing password ${password}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test the photographer login page accessibility
  console.log('\n--- Testing Photographer Login Page ---');
  try {
    const pageResponse = await makeRequest('http://localhost:3001/auth/photographer-login', {
      method: 'GET'
    });
    
    console.log(`Photographer login page status: ${pageResponse.statusCode}`);
    if (pageResponse.statusCode === 200) {
      console.log('✅ Photographer login page is accessible');
    } else {
      console.log('❌ Photographer login page is not accessible');
    }
  } catch (error) {
    console.log(`❌ Error accessing photographer login page: ${error.message}`);
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
      timeout: 15000
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
testActualPhotographerLogin().catch(console.error);