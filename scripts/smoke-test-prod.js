const fetch = require('node-fetch')

const PROD_URL = process.env.PROD_URL || 'https://www.gallerypavilion.com'
const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Set EMAIL and PASSWORD env vars')
  process.exit(2)
}

async function run() {
  try {
    console.log('Logging in...')
    const loginResp = await fetch(`${PROD_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, type: 'photographer' }),
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
