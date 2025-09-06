const https = require('https');
const http = require('http');
const { URL } = require('url');

// Diagnostic script for photographer authentication issues
async function diagnosePhotographerAuth() {
  console.log('🔍 Diagnosing photographer authentication issues...');
  console.log('=' .repeat(60));
  
  // Test credentials - you should replace with actual test photographer credentials
  const testCredentials = {
    email: 'test@photographer.com',
    password: 'testpassword123'
  };
  
  const environments = [
    {
      name: 'Localhost',
      baseUrl: 'http://localhost:3001',
      protocol: http
    },
    {
      name: 'Production',
      baseUrl: 'https://www.gallerypavilion.com',
      protocol: https
    }
  ];
  
  for (const env of environments) {
    console.log(`\n📍 Testing ${env.name} Environment`);
    console.log('-'.repeat(40));
    
    // Test 1: Check if login page loads
    await testEndpoint({
      name: 'Login Page Access',
      url: `${env.baseUrl}/auth/photographer-login`,
      method: 'GET',
      protocol: env.protocol
    });
    
    // Test 2: Check NextAuth signin endpoint
    await testEndpoint({
      name: 'NextAuth Signin Endpoint',
      url: `${env.baseUrl}/api/auth/signin/photographer-login`,
      method: 'GET',
      protocol: env.protocol
    });
    
    // Test 3: Check CSRF token endpoint
    const csrfToken = await getCsrfToken(env.baseUrl, env.protocol);
    
    // Test 4: Test authentication callback
    if (csrfToken) {
      await testAuthentication({
        baseUrl: env.baseUrl,
        protocol: env.protocol,
        credentials: testCredentials,
        csrfToken
      });
    }
    

    
    // Test 5: Check database connectivity (for production)
    if (env.name === 'Production') {
      await testDatabaseConnectivity(env.baseUrl, env.protocol);
    }
  }
}

async function testEndpoint({ name, url, method, protocol, headers = {}, body = null }) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (protocol === https ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Photographer-Auth-Diagnostic/1.0',
        ...headers
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  ✓ ${name}: ${res.statusCode} ${res.statusMessage}`);
        if (res.statusCode >= 400) {
          console.log(`    ❌ Error details: ${data.substring(0, 200)}...`);
        }
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ ${name}: ${error.message}`);
      resolve({ error: error.message });
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function getCsrfToken(baseUrl, protocol) {
  console.log('  🔑 Getting CSRF token...');
  
  const result = await testEndpoint({
    name: 'CSRF Token',
    url: `${baseUrl}/api/auth/csrf`,
    method: 'GET',
    protocol
  });
  
  if (result.data) {
    try {
      const csrfData = JSON.parse(result.data);
      console.log(`    ✓ CSRF Token obtained: ${csrfData.csrfToken?.substring(0, 20)}...`);
      return csrfData.csrfToken;
    } catch (e) {
      console.log('    ❌ Failed to parse CSRF response');
    }
  }
  
  return null;
}

async function testAuthentication({ baseUrl, protocol, credentials, csrfToken }) {
  console.log('  🔐 Testing authentication...');
  
  const body = new URLSearchParams({
    email: credentials.email,
    password: credentials.password,
    csrfToken,
    callbackUrl: `${baseUrl}/dashboard`,
    json: 'true'
  }).toString();
  
  const result = await testEndpoint({
    name: 'Authentication Callback',
    url: `${baseUrl}/api/auth/callback/photographer-login`,
    method: 'POST',
    protocol,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });
  
  if (result.statusCode === 401) {
    console.log('    ❌ Authentication failed with 401 - Invalid credentials or database issue');
    console.log('    💡 Possible causes:');
    console.log('      - Photographer not found in database');
    console.log('      - Password mismatch');
    console.log('      - Photographer status not "approved"');
    console.log('      - Database connection issues');
  } else if (result.statusCode === 200) {
    console.log('    ✓ Authentication successful');
  } else {
    console.log(`    ⚠️  Unexpected status: ${result.statusCode}`);
  }
}

async function testDatabaseConnectivity(baseUrl, protocol) {
  console.log('  🗄️  Testing database connectivity...');
  
  // Test a simple API endpoint that requires database access
  const result = await testEndpoint({
    name: 'Database Health Check',
    url: `${baseUrl}/api/debug/user?email=test@photographer.com`,
    method: 'GET',
    protocol
  });
  
  if (result.statusCode === 200) {
    console.log('    ✓ Database connectivity appears healthy');
  } else if (result.statusCode === 500) {
    console.log('    ❌ Database connectivity issues detected');
    console.log('    💡 Check DATABASE_URL and Vercel Postgres configuration');
  }
}

// Additional diagnostic functions
async function checkEnvironmentVariables() {
  console.log('\n🔧 Environment Variables Check');
  console.log('-'.repeat(40));
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✓ ${varName}: Set (${value.substring(0, 20)}...)`);
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
}

// Run diagnostics
if (require.main === module) {
  diagnosePhotographerAuth()
    .then(() => {
      console.log('\n🏁 Diagnostic complete');
      console.log('\n💡 Next steps if authentication fails on production:');
      console.log('  1. Verify photographer exists in production database');
      console.log('  2. Check photographer status is "approved"');
      console.log('  3. Verify password hash matches');
      console.log('  4. Check Vercel environment variables');
      console.log('  5. Review Vercel function logs for detailed errors');
    })
    .catch(console.error);
}

module.exports = { diagnosePhotographerAuth };