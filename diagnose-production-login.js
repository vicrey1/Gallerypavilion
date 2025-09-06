const https = require('https');
const http = require('http');
const { URL } = require('url');

// Diagnose production login issue
async function diagnoseProductionLogin() {
  console.log('=== Diagnosing Production Login Issue ===\n');
  
  const testEmail = 'vameh09@gmail.com';
  const testPassword = 'password123';
  
  console.log(`Testing with email: ${testEmail}`);
  console.log(`Testing with password: ${testPassword}\n`);
  
  // Test 1: Compare CSRF token retrieval
  console.log('--- Step 1: CSRF Token Retrieval ---');
  
  const localhostCsrf = await getCsrfToken('http://localhost:3001');
  console.log('Localhost CSRF:', localhostCsrf.success ? '✅ Success' : '❌ Failed');
  
  const productionCsrf = await getCsrfToken('https://www.gallerypavilion.com');
  console.log('Production CSRF:', productionCsrf.success ? '✅ Success' : '❌ Failed');
  
  if (!localhostCsrf.success || !productionCsrf.success) {
    console.log('❌ CSRF token retrieval failed, cannot proceed');
    return;
  }
  
  // Test 2: Compare login attempts with detailed error analysis
  console.log('\n--- Step 2: Login Attempt Analysis ---');
  
  console.log('\nLocalhost login:');
  const localhostLogin = await attemptLogin('http://localhost:3001', testEmail, testPassword, localhostCsrf.token, localhostCsrf.cookies);
  
  console.log('\nProduction login:');
  const productionLogin = await attemptLogin('https://www.gallerypavilion.com', testEmail, testPassword, productionCsrf.token, productionCsrf.cookies);
  
  // Test 3: Compare session endpoints
  console.log('\n--- Step 3: Session Endpoint Comparison ---');
  
  console.log('\nLocalhost session:');
  await testSessionEndpoint('http://localhost:3001');
  
  console.log('\nProduction session:');
  await testSessionEndpoint('https://www.gallerypavilion.com');
  
  // Test 4: Test different credentials
  console.log('\n--- Step 4: Testing Alternative Credentials ---');
  
  const alternativeCredentials = [
    { email: 'admin@gallerypavilion.com', password: 'admin123' },
    { email: 'photographer@gallerypavilion.com', password: 'password123' },
    { email: 'test@test.com', password: 'password' }
  ];
  
  for (const creds of alternativeCredentials) {
    console.log(`\nTesting ${creds.email} on production:`);
    const altLogin = await attemptLogin('https://www.gallerypavilion.com', creds.email, creds.password, productionCsrf.token, productionCsrf.cookies);
  }
  
  // Test 5: Environment comparison
  console.log('\n--- Step 5: Environment Information ---');
  
  console.log('\nLocalhost environment:');
  await testEnvironmentInfo('http://localhost:3001');
  
  console.log('\nProduction environment:');
  await testEnvironmentInfo('https://www.gallerypavilion.com');
  
  // Summary
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log('1. Localhost login result:', localhostLogin.success ? '✅ Success' : `❌ Failed: ${localhostLogin.error}`);
  console.log('2. Production login result:', productionLogin.success ? '✅ Success' : `❌ Failed: ${productionLogin.error}`);
  
  if (!localhostLogin.success && !productionLogin.success) {
    console.log('\n🔍 ISSUE: Both environments failing - likely credential issue');
    console.log('   - Check if user exists in database');
    console.log('   - Verify password hash');
    console.log('   - Check user role and photographer status');
  } else if (localhostLogin.success && !productionLogin.success) {
    console.log('\n🔍 ISSUE: Production-specific problem');
    console.log('   - Different database content');
    console.log('   - Environment variable differences');
    console.log('   - Production deployment issues');
  } else if (!localhostLogin.success && productionLogin.success) {
    console.log('\n🔍 ISSUE: Localhost-specific problem');
    console.log('   - Local database out of sync');
    console.log('   - Local environment issues');
  } else {
    console.log('\n✅ Both environments working - issue might be intermittent');
  }
}

async function getCsrfToken(baseUrl) {
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/csrf`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      let cookies = '';
      if (response.headers['set-cookie']) {
        cookies = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      }
      
      return {
        success: true,
        token: data.csrfToken,
        cookies: cookies
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function attemptLogin(baseUrl, email, password, csrfToken, cookies) {
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/callback/photographer-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies
      },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent(baseUrl + '/dashboard')}&json=true`
    });
    
    console.log(`  Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        console.log(`  Response:`, data);
        
        if (data.url && data.url.includes('/dashboard')) {
          return { success: true, message: 'Login successful' };
        } else if (data.url && data.url.includes('error')) {
          const errorUrl = new URL(data.url, baseUrl);
          const errorParam = errorUrl.searchParams.get('error');
          const decodedError = errorParam ? decodeURIComponent(errorParam) : 'Unknown error';
          console.log(`  Error: ${decodedError}`);
          return { success: false, error: decodedError };
        } else {
          return { success: false, error: `Unexpected redirect: ${data.url}` };
        }
      } catch (parseError) {
        console.log(`  Raw response: ${response.data.substring(0, 200)}`);
        return { success: false, error: 'Invalid JSON response' };
      }
    } else {
      console.log(`  Raw response: ${response.data.substring(0, 200)}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSessionEndpoint(baseUrl) {
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/session`);
    console.log(`  Session endpoint status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        console.log(`  Session data:`, data);
      } catch (error) {
        console.log(`  Session response: ${response.data.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.log(`  Session endpoint error: ${error.message}`);
  }
}

async function testEnvironmentInfo(baseUrl) {
  const endpoints = [
    '/api/auth/providers',
    '/api/health',
    '/api/status'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`  ${endpoint}: ${response.statusCode}`);
      
      if (response.statusCode === 200 && response.data.length < 500) {
        try {
          const data = JSON.parse(response.data);
          console.log(`    Data:`, data);
        } catch (error) {
          console.log(`    Response: ${response.data.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`  ${endpoint}: Error - ${error.message}`);
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

// Run the diagnosis
diagnoseProductionLogin().catch(console.error);