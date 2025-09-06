const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test client login flow
async function testClientLogin() {
  console.log('Testing client login flow...');
  
  // Test 1: Check if invite page loads (both domains)
  console.log('\n1. Testing invite page...');
  for (const domain of ['https://gallerypavilion.com', 'https://www.gallerypavilion.com']) {
    try {
      const invitePageResponse = await makeRequest(`${domain}/invite`, {}, true);
      console.log(`✓ Invite page (${domain}) status:`, invitePageResponse.statusCode);
      if (invitePageResponse.statusCode === 200) {
        console.log('  → Working domain found!');
        break;
      }
    } catch (error) {
      console.log(`✗ Invite page (${domain}) error:`, error.message);
    }
  }
  
  // Test 2: Test invite validation API with a test code (both domains)
  console.log('\n2. Testing invite validation API...');
  for (const domain of ['https://gallerypavilion.com', 'https://www.gallerypavilion.com']) {
    try {
      const validateResponse = await makeRequest(`${domain}/api/invite/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteCode: 'TEST123'
        })
      }, true);
      console.log(`✓ Validation API (${domain}) status:`, validateResponse.statusCode);
      console.log('Response:', validateResponse.data);
      if (validateResponse.statusCode !== 307) {
        console.log('  → Working domain found!');
        break;
      }
    } catch (error) {
      console.log(`✗ Validation API (${domain}) error:`, error.message);
    }
  }
  
  // Test 3: Test with email instead of code
  console.log('\n3. Testing email-based validation...');
  try {
    const emailValidateResponse = await makeRequest('https://www.gallerypavilion.com/api/invite/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    }, true);
    console.log('✓ Email validation API status:', emailValidateResponse.statusCode);
    console.log('Response:', emailValidateResponse.data);
  } catch (error) {
    console.log('✗ Email validation API error:', error.message);
  }
  
  // Test 4: Test client galleries API
  console.log('\n4. Testing client galleries API...');
  try {
    const galleriesResponse = await makeRequest('https://www.gallerypavilion.com/api/client/galleries?email=test@example.com', {}, true);
    console.log('✓ Client galleries API status:', galleriesResponse.statusCode);
    console.log('Response:', galleriesResponse.data);
  } catch (error) {
    console.log('✗ Client galleries API error:', error.message);
  }
}

function makeRequest(url, options = {}, followRedirects = false) {
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
      timeout: 10000
    };
    
    const req = lib.request(requestOptions, (res) => {
      // Handle redirects
      if (followRedirects && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        console.log(`  → Redirect ${res.statusCode} to:`, res.headers.location);
        const newUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
        return makeRequest(newUrl, options, followRedirects).then(resolve).catch(reject);
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
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
testClientLogin().catch(console.error);