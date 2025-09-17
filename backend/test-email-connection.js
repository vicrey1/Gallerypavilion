const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConnection() {
  console.log('🔧 Testing Email Service Connection...');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER ? '***SET***' : 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
  
  // Also check EMAIL_SERVER_* variants
  console.log('\n📋 Alternative Environment Variables:');
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST || 'NOT SET');
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT || 'NOT SET');
  console.log('EMAIL_SERVER_SECURE:', process.env.EMAIL_SERVER_SECURE || 'NOT SET');
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER ? '***SET***' : 'NOT SET');
  console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '***SET***' : 'NOT SET');
  
  // Configure email transporter based on environment
  const emailConfig = {
    host: process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || 587,
    secure: process.env.EMAIL_SERVER_SECURE === 'true' || process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_SERVER_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASS
    }
  };
  
  console.log('\n⚙️ Email Configuration:');
  console.log('Host:', emailConfig.host);
  console.log('Port:', emailConfig.port);
  console.log('Secure:', emailConfig.secure);
  console.log('Auth User:', emailConfig.auth.user ? '***SET***' : 'NOT SET');
  console.log('Auth Pass:', emailConfig.auth.pass ? '***SET***' : 'NOT SET');
  
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.log('\n❌ SMTP credentials not found!');
    console.log('Please set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
  try {
    console.log('\n🔌 Creating transporter...');
    const transporter = nodemailer.createTransport(emailConfig);
    
    console.log('\n🔍 Verifying connection...');
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('✅ Email service connection successful!');
      
      // Test sending an email
      console.log('\n📧 Sending test email...');
      const testEmail = {
        from: {
          name: 'Gallery Pavilion Test',
          address: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_SERVER_USER || process.env.SMTP_USER
        },
        to: 'vameh09@gmail.com',
        subject: '🧪 Test Email from Gallery Pavilion',
        text: 'This is a test email to verify the email service is working correctly.',
        html: `
          <h2>🧪 Test Email</h2>
          <p>This is a test email to verify the email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        `
      };
      
      const info = await transporter.sendMail(testEmail);
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', info.messageId);
      
      // Log preview URL for development
      if (process.env.NODE_ENV === 'development' && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Email preview URL:', previewUrl);
        }
      }
      
    } else {
      console.log('❌ Email service connection failed!');
    }
    
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    console.error('Full error:', error);
  }
}

testEmailConnection().catch(console.error);