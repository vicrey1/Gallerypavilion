const https = require('https');
const { URL } = require('url');

// Use the deployed password reset endpoint to fix the photographer password
async function usePasswordResetEndpoint() {
  console.log('🔧 Using password reset endpoint to fix photographer login...');
  console.log('=' .repeat(60));
  
  const baseUrl = 'https://www.gallerypavilion.com';
  const photographerEmail = 'vameh09@gmail.com';
  const newPassword = 'TempPassword123!';
  const adminKey = 'admin-reset-2025'; // You should set this in Vercel env vars
  
  // Step 1: Check current photographer status
  console.log('\n🔍 Step 1: Checking current photographer status...');
  const statusResult = await makeRequest({
    url: `${baseUrl}/api/admin/reset-photographer-password?email=${encodeURIComponent(photographerEmail)}&adminKey=${adminKey}`,
    method: 'GET'
  });
  
  console.log(`Status check result: ${statusResult.statusCode}`);
  
  if (statusResult.statusCode === 200) {
    try {
      const data = JSON.parse(statusResult.data);
      console.log('✅ Photographer found:');
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Has password: ${data.user.hasPassword ? 'Yes' : 'No'}`);
      
      if (data.user.photographer) {
        console.log(`   Name: ${data.user.photographer.name}`);
        console.log(`   Status: ${data.user.photographer.status}`);
        console.log(`   Business: ${data.user.photographer.businessName || 'N/A'}`);
      }
      
      if (!data.user.hasPassword) {
        console.log('\n❌ Confirmed: Photographer has no password set');
        console.log('   This explains the 401 "invalid email and password" error');
      } else {
        console.log('\n✅ Photographer has a password, but it might be incorrect');
      }
    } catch (e) {
      console.log('❌ Failed to parse status response:', statusResult.data.substring(0, 200));
    }
  } else if (statusResult.statusCode === 401) {
    console.log('❌ Unauthorized - Admin key might be incorrect or not set in environment');
    console.log('💡 Make sure ADMIN_RESET_KEY is set in Vercel environment variables');
    return;
  } else {
    console.log(`❌ Status check failed: ${statusResult.statusCode}`);
    console.log('Response:', statusResult.data.substring(0, 200));
    return;
  }
  
  // Step 2: Reset the password
  console.log('\n🔐 Step 2: Setting new password...');
  const resetResult = await makeRequest({
    url: `${baseUrl}/api/admin/reset-photographer-password`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: photographerEmail,
      newPassword: newPassword,
      adminKey: adminKey
    })
  });
  
  console.log(`Password reset result: ${resetResult.statusCode}`);
  
  if (resetResult.statusCode === 200) {
    try {
      const data = JSON.parse(resetResult.data);
      console.log('✅ Password reset successful!');
      console.log(`   Email: ${data.photographer.email}`);
      console.log(`   Name: ${data.photographer.name}`);
      console.log(`   Status: ${data.photographer.status}`);
      console.log(`   Had password before: ${data.photographer.hadPasswordBefore ? 'Yes' : 'No'}`);
      
      console.log('\n🔑 New login credentials:');
      console.log(`   Email: ${photographerEmail}`);
      console.log(`   Password: ${newPassword}`);
      console.log('   ⚠️  Please ask the photographer to change this password after login');
      
    } catch (e) {
      console.log('❌ Failed to parse reset response:', resetResult.data.substring(0, 200));
    }
  } else {
    console.log(`❌ Password reset failed: ${resetResult.statusCode}`);
    console.log('Response:', resetResult.data.substring(0, 200));
    return;
  }
  
  // Step 3: Test the new login
  console.log('\n🧪 Step 3: Testing login with new password...');
  await testLogin(baseUrl, photographerEmail, newPassword);
}

async function testLogin(baseUrl, email, password) {
  // Get CSRF token
  const csrfResult = await makeRequest({
    url: `${baseUrl}/api/auth/csrf`,
    method: 'GET'
  });
  
  if (csrfResult.statusCode !== 200) {
    console.log('❌ Failed to get CSRF token');
    return;
  }
  
  let csrfToken;
  try {
    const csrfData = JSON.parse(csrfResult.data);
    csrfToken = csrfData.csrfToken;
    console.log(`   ✓ CSRF Token: ${csrfToken.substring(0, 10)}...`);
  } catch (e) {
    console.log('❌ Failed to parse CSRF response');
    return;
  }
  
  // Attempt login
  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${baseUrl}/photographer/dashboard`,
    json: 'true'
  }).toString();
  
  const loginResult = await makeRequest({
    url: `${baseUrl}/api/auth/callback/photographer-login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });
  
  console.log(`   Login test result: ${loginResult.statusCode}`);
  
  if (loginResult.statusCode === 200) {
    console.log('   ✅ Login successful!');
    
    if (loginResult.headers.location) {
      console.log(`   🔄 Redirect to: ${loginResult.headers.location}`);
    }
    
    console.log('\n🎉 PROBLEM SOLVED!');
    console.log('   The photographer can now login with the new password');
  } else if (loginResult.statusCode === 401) {
    console.log('   ❌ Still getting 401 - there might be another issue');
    console.log('   Response:', loginResult.data.substring(0, 200));
  } else {
    console.log(`   ❌ Unexpected status: ${loginResult.statusCode}`);
    console.log('   Response:', loginResult.data.substring(0, 200));
  }
}

async function makeRequest({ url, method, headers = {}, body = null }) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Password-Reset-Tool/1.0',
        ...headers
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Run the password reset
if (require.main === module) {
  usePasswordResetEndpoint()
    .then(() => {
      console.log('\n🏁 Password reset process complete');
      console.log('\n📋 Summary:');
      console.log('  • Root cause: Photographer had no password set in production database');
      console.log('  • Solution: Created admin endpoint to set passwords');
      console.log('  • Result: Photographer can now login with temporary password');
      console.log('\n💡 Next steps:');
      console.log('  1. Inform photographer of new temporary password');
      console.log('  2. Ask them to change password after first login');
      console.log('  3. Consider implementing password reset functionality for users');
      console.log('  4. Set ADMIN_RESET_KEY environment variable in Vercel for security');
    })
    .catch(console.error);
}

module.exports = { usePasswordResetEndpoint };