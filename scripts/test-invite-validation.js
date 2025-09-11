const inviteData = [
  { inviteCode: 'TESTINV123' },
  { email: 'test@example.com' }
];

async function testInviteEndpoint() {
  for (const data of inviteData) {
    const response = await fetch('http://localhost:3001/api/invite/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log('\nTesting with:', data);
    console.log('Status:', response.status);
    console.log('Body:', await response.json());
  }
}

testInviteEndpoint();
