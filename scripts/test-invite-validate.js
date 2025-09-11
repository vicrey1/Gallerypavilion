const http = require('http')

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const options = {
      hostname: '10.16.116.176',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }

    const req = http.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: raw }))
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

;(async () => {
  console.log('Testing lowercase code')
  console.log(await postJson('/api/invite/validate', { inviteCode: 'nw5ihxfdcxzg' }))

  console.log('\nTesting uppercase code')
  console.log(await postJson('/api/invite/validate', { inviteCode: 'NW5IHXFD CXZG'.replace(/ /g, '') }))

  console.log('\nTesting email')
  // Use the normalized test client email found in the DB
  console.log(await postJson('/api/invite/validate', { email: 'vameh09@gmail.com' }))
})().catch((e) => console.error(e))
