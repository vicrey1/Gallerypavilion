import { testEmailConfig, sendPasswordResetEmail } from '../src/lib/email'

async function testEmails() {
  console.log('Testing email configuration...')
  const configTest = await testEmailConfig()
  
  if (!configTest.success) {
    console.error('Email configuration test failed:', configTest.error)
    return
  }
  
  console.log('Email configuration test passed!')
  
  try {
    console.log('Attempting to send test reset email...')
    await sendPasswordResetEmail('vameh09@gmail.com', 'http://localhost:3001/test-reset')
    console.log('Test reset email sent successfully!')
  } catch (error) {
    console.error('Failed to send test reset email:', error)
  }
}

testEmails()
