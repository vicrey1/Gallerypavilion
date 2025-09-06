const https = require('https');
const { URL } = require('url');

// Check production photographers and their status
async function checkProductionPhotographers() {
  console.log('🔍 Checking production photographers...');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://www.gallerypavilion.com';
  
  // Test the debug users endpoint to see photographers
  const result = await makeRequest({
    url: `${baseUrl}/api/debug/users`,
    method: 'GET'
  });
  
  if (result.statusCode === 200) {
    try {
      const data = JSON.parse(result.data);
      console.log(`\n📊 Found ${data.users?.length || 0} users in production database`);
      
      if (data.users && data.users.length > 0) {
        const photographers = data.users.filter(user => user.photographer);
        console.log(`\n👨‍📷 Photographers found: ${photographers.length}`);
        
        photographers.forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.email}`);
          console.log(`   Name: ${user.photographer.name}`);
          console.log(`   Status: ${user.photographer.status}`);
          console.log(`   Business: ${user.photographer.businessName || 'N/A'}`);
          console.log(`   Created: ${user.photographer.createdAt}`);
        });
        
        // Check for approved photographers
        const approvedPhotographers = photographers.filter(p => p.photographer.status === 'approved');
        console.log(`\n✅ Approved photographers: ${approvedPhotographers.length}`);
        
        if (approvedPhotographers.length === 0) {
          console.log('\n❌ No approved photographers found!');
          console.log('💡 This could be why login fails - photographers need "approved" status');
        }
        
        // Check for pending photographers
        const pendingPhotographers = photographers.filter(p => p.photographer.status === 'pending');
        if (pendingPhotographers.length > 0) {
          console.log(`\n⏳ Pending photographers: ${pendingPhotographers.length}`);
          console.log('💡 These photographers cannot login until approved');
        }
      } else {
        console.log('\n❌ No users found in production database');
        console.log('💡 Database might be empty or not properly seeded');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
      console.log('Raw response:', result.data.substring(0, 500));
    }
  } else {
    console.log(`❌ Failed to fetch users: ${result.statusCode}`);
    console.log('Error:', result.data.substring(0, 500));
  }
  
  // Also check if there's a specific photographer we can test with
  console.log('\n🔍 Checking for test photographer...');
  const testResult = await makeRequest({
    url: `${baseUrl}/api/debug/user?email=test@photographer.com`,
    method: 'GET'
  });
  
  if (testResult.statusCode === 200) {
    try {
      const userData = JSON.parse(testResult.data);
      if (userData.success && userData.user) {
        console.log('✅ Test photographer found:');
        console.log(`   Email: ${userData.user.email}`);
        console.log(`   Role: ${userData.user.role}`);
        if (userData.user.photographer) {
          console.log(`   Photographer Status: ${userData.user.photographer.status}`);
          console.log(`   Photographer Name: ${userData.user.photographer.name}`);
        }
      } else {
        console.log('❌ Test photographer not found');
      }
    } catch (e) {
      console.log('❌ Failed to parse test photographer response');
    }
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
        'User-Agent': 'Production-Photographer-Check/1.0',
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

// Run the check
if (require.main === module) {
  checkProductionPhotographers()
    .then(() => {
      console.log('\n🏁 Production photographer check complete');
      console.log('\n💡 If no approved photographers exist:');
      console.log('  1. Create a test photographer account');
      console.log('  2. Approve the photographer via admin panel');
      console.log('  3. Test login with approved photographer credentials');
    })
    .catch(console.error);
}

module.exports = { checkProductionPhotographers };