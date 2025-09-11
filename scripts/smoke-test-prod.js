// Load local .env automatically (optional) so the script can run non-interactively
try {
  require('dotenv').config()
} catch (e) {
  // dotenv is optional at runtime; we'll install it as a dev dependency in the repo
}

const fetch = require('node-fetch')

const PROD_URL = process.env.PROD_URL || 'https://www.gallerypavilion.com'
let EMAIL = process.env.EMAIL
let PASSWORD = process.env.PASSWORD
const TYPE = process.env.TYPE || 'photographer'
const ALLOW_SIGNUP = String(process.env.ALLOW_SIGNUP || '').toLowerCase() === 'true'
const FORCE_SIGNUP = String(process.env.FORCE_SIGNUP || '').toLowerCase() === 'true'

if (!EMAIL || !PASSWORD) {
  if (ALLOW_SIGNUP) {
    const gen = () => Math.random().toString(36).slice(2, 8)
    const testEmail = process.env.TEST_EMAIL || `smoketest+${Date.now()}${gen()}@example.com`
    const testPassword = process.env.TEST_PASSWORD || `P@ssw0rd-${Date.now().toString().slice(-6)}`
    console.log('EMAIL or PASSWORD not provided; ALLOW_SIGNUP=true — will use generated test credentials:', testEmail)
    EMAIL = testEmail
    PASSWORD = testPassword
  } else {
    console.error('Set EMAIL and PASSWORD env vars')
    process.exit(2)
  }
}

async function run() {
  try {
    // If forced signup is requested, create a photographer test user directly and exit
    if (FORCE_SIGNUP && ALLOW_SIGNUP) {
      const gen = () => Math.random().toString(36).slice(2, 8)
      const testEmail = process.env.TEST_EMAIL || `smoketest+${Date.now()}${gen()}@example.com`
      const testPassword = process.env.TEST_PASSWORD || `P@ssw0rd-${Date.now().toString().slice(-6)}`
      const testName = process.env.TEST_NAME || 'Smoke Test'
      console.log('FORCE_SIGNUP=true — creating test photographer:', testEmail)

      const signupResp = await fetch(`${PROD_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword, name: testName, type: 'photographer' }),
        redirect: 'manual'
      })

      console.log('Signup status:', signupResp.status)
      const signupSc = signupResp.headers.raw()['set-cookie'] || []
      signupSc.forEach(h => console.log('  signup-set-cookie:', h))

      const signupCookieHeader = signupSc.find(h => h.startsWith('auth-token='))
      const signupCookie = signupCookieHeader ? signupCookieHeader.split(';')[0] : null

      const meResp2 = await fetch(`${PROD_URL}/api/auth/me`, {
        method: 'GET',
        headers: signupCookie ? { Cookie: signupCookie } : {}
      })
      console.log('/api/auth/me status (after signup):', meResp2.status)
      console.log('Body:', await meResp2.text())
      return
    }

    console.log('Logging in...')
    const loginResp = await fetch(`${PROD_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, type: TYPE }),
      redirect: 'manual'
    })

  console.log('Login status:', loginResp.status)
    console.log('Set-Cookie headers:')
    const sc = loginResp.headers.raw()['set-cookie'] || []
    sc.forEach(h => console.log('  ', h))

    // Try to call /api/auth/me with cookies from login (node-fetch doesn't store cookies by default)
    // Use cookie from Set-Cookie if present
    const cookieHeader = sc.find(h => h.startsWith('auth-token='))
    const cookie = cookieHeader ? cookieHeader.split(';')[0] : null

    // If login failed and signup allowed, create a photographer test user automatically
    if (loginResp.status === 401 && TYPE === 'photographer' && ALLOW_SIGNUP) {
      const gen = () => Math.random().toString(36).slice(2, 8)
      const testEmail = process.env.TEST_EMAIL || `smoketest+${Date.now()}${gen()}@example.com`
      const testPassword = process.env.TEST_PASSWORD || `P@ssw0rd-${Date.now().toString().slice(-6)}`
      const testName = process.env.TEST_NAME || 'Smoke Test'
      console.log('Login failed; ALLOW_SIGNUP=true — creating test photographer:', testEmail)

      const signupResp = await fetch(`${PROD_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword, name: testName, type: 'photographer' }),
        redirect: 'manual'
      })

      console.log('Signup status:', signupResp.status)
      const signupSc = signupResp.headers.raw()['set-cookie'] || []
      signupSc.forEach(h => console.log('  signup-set-cookie:', h))

      const signupCookieHeader = signupSc.find(h => h.startsWith('auth-token='))
      const signupCookie = signupCookieHeader ? signupCookieHeader.split(';')[0] : null

      const meResp2 = await fetch(`${PROD_URL}/api/auth/me`, {
        method: 'GET',
        headers: signupCookie ? { Cookie: signupCookie } : {}
      })
      console.log('/api/auth/me status (after signup):', meResp2.status)
      console.log('Body:', await meResp2.text())
      return
    }

    const meResp = await fetch(`${PROD_URL}/api/auth/me`, {
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : {}
    })
    console.log('/api/auth/me status:', meResp.status)
    console.log('Body:', await meResp.text())
  } catch (e) {
    console.error('Smoke test failed:', e)
    process.exit(1)
  }
}

run()
