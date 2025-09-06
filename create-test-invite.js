const https = require('https');
const { URL } = require('url');

// Create a test invite for testing client login
async function createTestInvite() {
  console.log('Creating test invite for client login testing...');
  
  try {
    // First, get the admin login page to extract CSRF token
    console.log('\n1. Getting admin login page...');
    const loginPageResponse = await makeRequest('https://www.gallerypavilion.com/api/auth/signin/admin-login');
    
    if (loginPageResponse.statusCode !== 200) {
      throw new Error(`Failed to get login page: ${loginPageResponse.statusCode}`);
    }
    
    // Extract CSRF token
    const csrfMatch = loginPageResponse.data.match(/name="csrfToken"[^>]*value="([^"]+)"/);
    if (!csrfMatch) {
      throw new Error('Could not find CSRF token in login page');
    }
    
    const csrfToken = csrfMatch[1];
    console.log('✓ CSRF token extracted:', csrfToken.substring(0, 10) + '...');
    
    // Login as admin
    console.log('\n2. Logging in as admin...');
    const loginResponse = await makeRequest('https://www.gallerypavilion.com/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': loginPageResponse.headers['set-cookie']?.join('; ') || ''
      },
      body: `csrfToken=${encodeURIComponent(csrfToken)}&email=admin%40gallerypavilion.com&password=admin123&callbackUrl=https%3A%2F%2Fwww.gallerypavilion.com%2Fadmin&json=true`
    });
    
    console.log('Login response status:', loginResponse.statusCode);
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.url) {
      console.log('✓ Admin login successful');
      
      // Extract session cookies
      const sessionCookies = loginResponse.headers['set-cookie']?.join('; ') || '';
      console.log('Session cookies:', sessionCookies.substring(0, 100) + '...');
      
      // Now create a test invite
      console.log('\n3. Creating test invite...');
      const inviteData = {
        galleryId: 'test-gallery-id', // This might need to be a real gallery ID
        clientEmail: 'testclient@example.com',
        inviteCode: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        type: 'single_use',
        permissions: {
          canView: true,
          canFavorite: true,
          canComment: false,
          canDownload: false,
          canRequestPurchase: false
        }
      };
      
      const createInviteResponse = await makeRequest('https://www.gallerypavilion.com/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookies
        },
        body: JSON.stringify(inviteData)
      });
      
      console.log('Create invite response status:', createInviteResponse.statusCode);
      console.log('Create invite response:', createInviteResponse.data);
      
      if (createInviteResponse.statusCode === 201 || createInviteResponse.statusCode === 200) {
        console.log('✓ Test invite created successfully!');
        console.log('Test invite code:', inviteData.inviteCode);
        console.log('Test client email:', inviteData.clientEmail);
        
        // Test the invite validation
        console.log('\n4. Testing invite validation...');
        const validateResponse = await makeRequest('https://www.gallerypavilion.com/api/invite/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inviteCode: inviteData.inviteCode
          })
        });
        
        console.log('Validate response status:', validateResponse.statusCode);
        console.log('Validate response:', validateResponse.data);
        
        if (validateResponse.statusCode === 200) {
          console.log('✓ Invite validation successful!');
        } else {
          console.log('✗ Invite validation failed');
        }
      } else {
        console.log('✗ Failed to create test invite');
      }
    } else {
      console.log('✗ Admin login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : require('http');
    
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
createTestInvite().catch(console.error);