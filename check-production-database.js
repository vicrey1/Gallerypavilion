const https = require('https');
const http = require('http');
const { URL } = require('url');

// Check production database structure and user data
async function checkProductionDatabase() {
  console.log('Checking production database structure and user data...');
  
  const testEndpoints = [
    '/api/debug/users',
    '/api/debug/photographers', 
    '/api/debug/database-info',
    '/api/auth/session'
  ];
  
  for (const endpoint of testEndpoints) {
    console.log(`\n=== Testing ${endpoint} ===`);
    
    // Test localhost
    console.log('\n--- Localhost ---');
    await testEndpoint('http://localhost:3001' + endpoint);
    
    // Test production
    console.log('\n--- Production ---');
    await testEndpoint('https://www.gallerypavilion.com' + endpoint);
  }
  
  // Test specific user lookup
  console.log('\n=== Testing User Lookup ===');
  const userEmails = ['vameh09@gmail.com', 'test@photographer.com'];
  
  for (const email of userEmails) {
    console.log(`\n--- Checking ${email} ---`);
    
    // Localhost
    console.log('Localhost:');
    await testEndpoint(`http://localhost:3001/api/debug/user?email=${encodeURIComponent(email)}`);
    
    // Production
    console.log('Production:');
    await testEndpoint(`https://www.gallerypavilion.com/api/debug/user?email=${encodeURIComponent(email)}`);
  }
  
  // Test database connection and schema
  console.log('\n=== Testing Database Schema ===');
  
  console.log('\nLocalhost schema:');
  await testEndpoint('http://localhost:3001/api/debug/schema');
  
  console.log('\nProduction schema:');
  await testEndpoint('https://www.gallerypavilion.com/api/debug/schema');
}

async function testEndpoint(url) {
  try {
    const response = await makeRequest(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Database-Debug-Tool/1.0'
      }
    });
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        console.log('Response data:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.log('Response (first 500 chars):', response.data.substring(0, 500));
      }
    } else if (response.statusCode === 404) {
      console.log('❌ Endpoint not found');
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('❌ Access denied');
    } else {
      console.log('Response (first 200 chars):', response.data.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Request error: ${error.message}`);
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

// Run the check
checkProductionDatabase().catch(console.error);

// Also create a simple API endpoint test
console.log('\n=== Creating Debug API Endpoints ===');
console.log('You may need to create these API endpoints in your Next.js app:');
console.log('1. /api/debug/users - List all users');
console.log('2. /api/debug/photographers - List all photographers');
console.log('3. /api/debug/user?email=xxx - Get specific user');
console.log('4. /api/debug/schema - Show database schema info');
console.log('\nExample API endpoint code:');
console.log(`
// pages/api/debug/users.js or app/api/debug/users/route.js
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      include: {
        photographer: true,
        client: true
      },
      take: 10
    });
    
    return Response.json({
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        hasPhotographer: !!user.photographer,
        hasClient: !!user.client,
        photographerStatus: user.photographer?.status,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}`);