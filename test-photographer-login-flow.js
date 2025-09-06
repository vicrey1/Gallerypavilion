require('dotenv').config({ path: '.env.local' })
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test complete photographer login flow
async function testPhotographerLoginFlow() {
  console.log('Testing complete photographer login flow...');
  
  const testCredentials = {
    email: 'vameh09@gmail.com',
    password: 'password123'
  };
  
  console.log('Using credentials:');
  console.log('Email:', testCredentials.email);
  console.log('Password:', testCredentials.password);
  
  let sessionCookies = '';
  
  // Step 1: Get CSRF token
  console.log('\n--- Step 1: Get CSRF Token ---');
  try {
    const csrfResponse = await makeRequest('http://localhost:3001/api/auth/csrf', {
      method: 'GET'
    });
    
    console.log(`CSRF status: ${csrfResponse.statusCode}`);
    if (csrfResponse.statusCode === 200) {
      const csrfData = JSON.parse(csrfResponse.data);
      const csrfToken = csrfData.csrfToken;
      console.log('✅ CSRF token obtained');
      
      // Extract cookies from response
      const setCookieHeaders = csrfResponse.headers['set-cookie'];
      if (setCookieHeaders) {
        sessionCookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('Cookies set:', sessionCookies);
      }
      
      // Step 2: Perform login
      console.log('\n--- Step 2: Perform Login ---');
      const loginResponse = await makeRequest('http://localhost:3001/api/auth/callback/photographer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': sessionCookies
        },
        body: `email=${encodeURIComponent(testCredentials.email)}&password=${encodeURIComponent(testCredentials.password)}&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent('http://localhost:3001/dashboard')}&json=true`
      });
      
      console.log(`Login status: ${loginResponse.statusCode}`);
      
      if (loginResponse.statusCode === 200) {
        try {
          const loginData = JSON.parse(loginResponse.data);
          console.log('Login response:', loginData);
          
          // Update cookies with login response
          const loginSetCookieHeaders = loginResponse.headers['set-cookie'];
          if (loginSetCookieHeaders) {
            const newCookies = loginSetCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
            sessionCookies = sessionCookies + '; ' + newCookies;
            console.log('Updated cookies after login');
          }
          
          // Step 3: Check session after login
          console.log('\n--- Step 3: Check Session After Login ---');
          const sessionResponse = await makeRequest('http://localhost:3001/api/auth/session', {
            method: 'GET',
            headers: {
              'Cookie': sessionCookies
            }
          });
          
          console.log(`Session check status: ${sessionResponse.statusCode}`);
          if (sessionResponse.statusCode === 200) {
            try {
              const sessionData = JSON.parse(sessionResponse.data);
              console.log('Session data:', JSON.stringify(sessionData, null, 2));
              
              if (sessionData && sessionData.user) {
                console.log('✅ Login successful! User session created:');
                console.log(`- User ID: ${sessionData.user.id}`);
                console.log(`- Email: ${sessionData.user.email}`);
                console.log(`- Role: ${sessionData.user.role}`);
                console.log(`- Photographer ID: ${sessionData.user.photographerId}`);
              } else {
                console.log('❌ Login failed - no user session found');
              }
            } catch (error) {
              console.log('❌ Error parsing session data:', error.message);
              console.log('Raw session response:', sessionResponse.data);
            }
          } else {
            console.log('❌ Session check failed');
          }
          
          // Step 4: Test dashboard access
          console.log('\n--- Step 4: Test Dashboard Access ---');
          const dashboardResponse = await makeRequest('http://localhost:3001/dashboard', {
            method: 'GET',
            headers: {
              'Cookie': sessionCookies
            }
          });
          
          console.log(`Dashboard access status: ${dashboardResponse.statusCode}`);
          if (dashboardResponse.statusCode === 200) {
            console.log('✅ Dashboard accessible after login');
          } else if (dashboardResponse.statusCode === 302 || dashboardResponse.statusCode === 307) {
            console.log('🔄 Dashboard redirected to:', dashboardResponse.headers.location);
            if (dashboardResponse.headers.location && dashboardResponse.headers.location.includes('login')) {
              console.log('❌ Dashboard redirected to login - authentication failed');
            }
          } else {
            console.log('❌ Dashboard not accessible');
          }
          
        } catch (error) {
          console.log('❌ Error parsing login response:', error.message);
          console.log('Raw login response:', loginResponse.data.substring(0, 500));
        }
      } else {
        console.log('❌ Login request failed');
        console.log('Response:', loginResponse.data.substring(0, 500));
      }
      
    } else {
      console.log('❌ Failed to get CSRF token');
    }
  } catch (error) {
    console.log(`❌ Error in login flow: ${error.message}`);
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
testPhotographerLoginFlow().catch(console.error);