// Using built-in fetch (Node.js 18+)

async function testPhotographerLogin() {
  try {
    console.log('🧪 Testing photographer login manually...');
    
    const baseUrl = 'http://localhost:3001';
    const email = 'vameh09@gmail.com';
    const password = 'Cronaldo7';
    
    // Step 1: Get CSRF token
    console.log('\n1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);
    
    // Step 2: Attempt login
    console.log('\n2️⃣ Attempting photographer login...');
    const loginData = new URLSearchParams({
      email: email,
      password: password,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${baseUrl}/photographer/dashboard`,
      json: 'true'
    });
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/photographer-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfResponse.headers.get('set-cookie') || ''
      },
      body: loginData.toString(),
      redirect: 'manual'
    });
    
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location');
      console.log('✅ Redirect to:', location);
      
      if (location && location.includes('/photographer/dashboard')) {
        console.log('🎉 Login successful! Redirected to photographer dashboard.');
      } else if (location && location.includes('error')) {
        console.log('❌ Login failed with error redirect:', location);
      } else {
        console.log('🤔 Unexpected redirect:', location);
      }
    } else {
      const responseText = await loginResponse.text();
      console.log('Response body:', responseText.substring(0, 500));
    }
    
    // Step 3: Check session if login was successful
    if (loginResponse.status === 302) {
      console.log('\n3️⃣ Checking session...');
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          'Cookie': loginResponse.headers.get('set-cookie') || ''
        }
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
      } else {
        console.log('❌ Failed to get session:', sessionResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPhotographerLogin();