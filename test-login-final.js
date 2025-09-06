require('dotenv').config({ path: '.env.local' })
const fetch = require('node-fetch')

async function testPhotographerLogin() {
  console.log('🧪 Testing photographer login after fixes...')
  
  const testCredentials = [
    {
      email: 'test@photographer.com',
      password: 'password123',
      description: 'Original test user (now has photographer record)'
    },
    {
      email: 'photographer@test.com',
      password: 'testpass123',
      description: 'New test user with known credentials'
    }
  ]
  
  for (const creds of testCredentials) {
    console.log(`\n🔍 Testing: ${creds.description}`)
    console.log(`📧 Email: ${creds.email}`)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/callback/photographer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: creds.email,
          password: creds.password,
          csrfToken: 'test-token',
          callbackUrl: 'http://localhost:3001/photographer/dashboard',
          json: 'true'
        })
      })
      
      console.log(`📊 Response Status: ${response.status}`)
      console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log(`📄 Response Body:`, responseText)
      
      if (response.status === 200) {
        console.log('✅ Login successful!')
      } else {
        console.log('❌ Login failed')
      }
      
    } catch (error) {
      console.error('❌ Error testing login:', error.message)
    }
  }
}

testPhotographerLogin().catch(console.error)