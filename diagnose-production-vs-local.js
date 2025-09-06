require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
// Using built-in fetch API (Node.js 18+)

const prisma = new PrismaClient();

async function diagnoseProdVsLocal() {
  console.log('🔍 PRODUCTION vs LOCAL DIAGNOSIS');
  console.log('=' .repeat(50));
  
  // 1. Check Environment Variables
  console.log('\n📋 ENVIRONMENT VARIABLES:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('NEXTAUTH_URL_INTERNAL:', process.env.NEXTAUTH_URL_INTERNAL);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
  // 2. Test Database Connection
  console.log('\n🗄️  DATABASE CONNECTION TEST:');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if vameh09@gmail.com exists
    const user = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' },
      include: { photographer: true }
    });
    
    if (user) {
      console.log('✅ Test user vameh09@gmail.com found');
      console.log('   - Role:', user.role);
      console.log('   - Has password:', !!user.password);
      console.log('   - Photographer status:', user.photographer?.status);
      console.log('   - Photographer approved:', user.photographer?.isApproved);
    } else {
      console.log('❌ Test user vameh09@gmail.com not found');
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  
  // 3. Test Production Login Endpoint
  console.log('\n🌐 PRODUCTION LOGIN TEST:');
  try {
    // First get CSRF token
    const csrfResponse = await fetch('https://gallerypavilion.com/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF token retrieved:', !!csrfData.csrfToken);
    
    // Test login endpoint
    const loginResponse = await fetch('https://gallerypavilion.com/api/auth/callback/photographer-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfData.csrfToken}`
      },
      body: new URLSearchParams({
        email: 'vameh09@gmail.com',
        password: 'password123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'https://gallerypavilion.com/dashboard',
        json: 'true'
      })
    });
    
    console.log('📡 Production login response status:', loginResponse.status);
    console.log('📡 Production login response headers:', Object.fromEntries(loginResponse.headers));
    
    const loginData = await loginResponse.text();
    console.log('📡 Production login response body:', loginData.substring(0, 500));
    
  } catch (error) {
    console.log('❌ Production login test failed:', error.message);
  }
  
  // 4. Test Local Login (if running)
  console.log('\n🏠 LOCAL LOGIN TEST:');
  try {
    // Test if local server is running
    const localResponse = await fetch('http://localhost:3001/api/auth/csrf');
    if (localResponse.ok) {
      const localCsrfData = await localResponse.json();
      console.log('✅ Local CSRF token retrieved:', !!localCsrfData.csrfToken);
      
      // Test local login
      const localLoginResponse = await fetch('http://localhost:3001/api/auth/callback/photographer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `next-auth.csrf-token=${localCsrfData.csrfToken}`
        },
        body: new URLSearchParams({
          email: 'vameh09@gmail.com',
          password: 'password123',
          csrfToken: localCsrfData.csrfToken,
          callbackUrl: 'http://localhost:3001/dashboard',
          json: 'true'
        })
      });
      
      console.log('📡 Local login response status:', localLoginResponse.status);
      const localLoginData = await localLoginResponse.text();
      console.log('📡 Local login response body:', localLoginData.substring(0, 500));
    } else {
      console.log('⚠️  Local server not running on port 3001');
    }
  } catch (error) {
    console.log('⚠️  Local server test failed:', error.message);
  }
  
  // 5. Check NextAuth Configuration Differences
  console.log('\n⚙️  NEXTAUTH CONFIGURATION:');
  console.log('Expected production URL:', 'https://gallerypavilion.com');
  console.log('Configured NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('Configured NEXTAUTH_URL_INTERNAL:', process.env.NEXTAUTH_URL_INTERNAL);
  
  // 6. Check for common production issues
  console.log('\n🔧 COMMON PRODUCTION ISSUES CHECK:');
  
  // Check if using secure cookies
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('NODE_ENV is production:', isProduction);
  console.log('Should use secure cookies:', isProduction);
  
  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('Database URL protocol:', dbUrl.split('://')[0]);
    console.log('Database URL includes SSL:', dbUrl.includes('sslmode=require'));
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. Check Vercel environment variables match local .env.local');
  console.log('2. Verify NEXTAUTH_URL is set to https://gallerypavilion.com in production');
  console.log('3. Ensure DATABASE_URL is correctly configured in Vercel');
  console.log('4. Check Vercel function logs for detailed error messages');
  console.log('5. Verify that the photographer record exists in production database');
  
  await prisma.$disconnect();
}

diagnoseProdVsLocal().catch(console.error);