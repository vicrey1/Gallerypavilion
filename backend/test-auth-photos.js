const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test authenticated photo access
async function testAuthenticatedPhotoAccess() {
  console.log('🔍 Testing Authenticated Photo Access...');
  
  const photoId = '68c85a2ce1ede37536a2748a';
  const baseURL = 'http://localhost:5000';
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: '68c67c9a2cb1f6f9dc9c2bdc', 
      email: 'vameh09@gmail.com', 
      role: 'PHOTOGRAPHER' 
    }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '1h' }
  );
  
  console.log('Generated token:', token.substring(0, 50) + '...');
  
  // Test authenticated access
  const endpoints = [
    `/api/photos/${photoId}/preview`,
    `/api/photos/${photoId}/thumbnail`,
    `/api/photos/${photoId}/download`
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint}...`);
      const response = await axios.get(baseURL + endpoint, {
        headers: {
          Cookie: `token=${token}`
        },
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      console.log(`Response: ${response.status} ${response.statusText}`);
      if (response.status !== 200) {
        console.log('Error data:', response.data);
      } else {
        console.log('✅ Success! Content-Type:', response.headers['content-type']);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testAuthenticatedPhotoAccess().catch(console.error);