const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkProductionEnv() {
  try {
    console.log('🔍 Checking production environment variables...');
    
    const response = await makeRequest('https://www.gallerypavilion.com/api/debug/env?secret=debug-env-check');
    
    console.log('Status:', response.statusCode);
    
    if (response.statusCode === 200) {
      const envData = JSON.parse(response.data);
      console.log('\n📋 Production Environment Variables:');
      console.log('=====================================');
      
      Object.entries(envData.environment).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      
      console.log('\n🎯 Key Findings:');
      if (envData.environment.DATABASE_URL === '[NOT SET]') {
        console.log('❌ DATABASE_URL is not set');
        if (envData.environment.PRISMA_DATABASE_URL) {
          console.log('✅ But PRISMA_DATABASE_URL might be available');
        }
      } else {
        console.log('✅ DATABASE_URL is set');
      }
      
      return envData.environment;
    } else {
      console.log('❌ Failed to get environment info:', response.data);
      return null;
    }
  } catch (error) {
    console.error('💥 Error checking environment:', error.message);
    return null;
  }
}

if (require.main === module) {
  checkProductionEnv();
}

module.exports = { checkProductionEnv };