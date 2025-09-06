const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseProductionPhotographerLogin() {
  console.log('🔍 PRODUCTION PHOTOGRAPHER LOGIN DIAGNOSIS');
  console.log('==========================================\n');
  
  try {
    // 1. Check Environment Variables
    console.log('1️⃣ ENVIRONMENT VARIABLES CHECK:');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ NOT SET');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('');
    
    // 2. Test Database Connection
    console.log('2️⃣ DATABASE CONNECTION TEST:');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      const userCount = await prisma.user.count();
      console.log(`📊 Total users in database: ${userCount}`);
      
    } catch (dbError) {
      console.log('❌ Database connection failed:', dbError.message);
      return;
    }
    console.log('');
    
    // 3. Check Photographer Records
    console.log('3️⃣ PHOTOGRAPHER RECORDS CHECK:');
    
    // Check all users with photographer role
    const photographerUsers = await prisma.user.findMany({
      where: { role: 'photographer' },
      include: { photographer: true }
    });
    
    console.log(`📸 Users with photographer role: ${photographerUsers.length}`);
    
    for (const user of photographerUsers) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name || 'No name'}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Has Password: ${!!user.password}`);
      console.log(`   - Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      
      if (user.photographer) {
        console.log(`   - Photographer Record: ✅ EXISTS`);
        console.log(`   - Business Name: ${user.photographer.businessName || 'Not set'}`);
        console.log(`   - Status: ${user.photographer.status}`);
        console.log(`   - Phone: ${user.photographer.phone || 'Not set'}`);
      } else {
        console.log(`   - Photographer Record: ❌ MISSING`);
      }
    }
    console.log('');
    
    // 4. Test Specific Photographer Login
    console.log('4️⃣ SPECIFIC PHOTOGRAPHER TEST:');
    const testEmail = 'vameh09@gmail.com';
    const testPassword = 'Cronaldo7';
    
    console.log(`Testing login for: ${testEmail}`);
    
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { photographer: true }
    });
    
    if (!testUser) {
      console.log('❌ Test user not found in production database');
      console.log('💡 Need to run seed-production-photographer.js');
    } else {
      console.log('✅ Test user found');
      
      if (!testUser.password) {
        console.log('❌ User has no password set');
      } else {
        const passwordValid = await bcrypt.compare(testPassword, testUser.password);
        console.log(`🔑 Password validation: ${passwordValid ? '✅ VALID' : '❌ INVALID'}`);
      }
      
      if (testUser.role !== 'photographer') {
        console.log(`❌ User role is '${testUser.role}', should be 'photographer'`);
      } else {
        console.log('✅ User has photographer role');
      }
      
      if (!testUser.photographer) {
        console.log('❌ Missing photographer profile record');
      } else {
        console.log(`✅ Photographer profile exists with status: ${testUser.photographer.status}`);
        if (testUser.photographer.status !== 'approved') {
          console.log('⚠️  Photographer status is not approved');
        }
      }
    }
    console.log('');
    
    // 5. Check NextAuth Tables
    console.log('5️⃣ NEXTAUTH TABLES CHECK:');
    try {
      const accountCount = await prisma.account.count();
      const sessionCount = await prisma.session.count();
      console.log(`📊 Accounts: ${accountCount}`);
      console.log(`📊 Sessions: ${sessionCount}`);
    } catch (error) {
      console.log('❌ Error checking NextAuth tables:', error.message);
    }
    console.log('');
    
    // 6. Recommendations
    console.log('6️⃣ RECOMMENDATIONS:');
    
    if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_URL.includes('gallerypavilion.com')) {
      console.log('🔧 Set NEXTAUTH_URL to: https://gallerypavilion.com');
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      console.log('🔧 Set NEXTAUTH_SECRET in Vercel environment variables');
    }
    
    if (photographerUsers.length === 0) {
      console.log('🔧 Run seed-production-photographer.js to create test photographer');
    }
    
    const usersWithoutPhotographerRecord = photographerUsers.filter(u => !u.photographer);
    if (usersWithoutPhotographerRecord.length > 0) {
      console.log('🔧 Some photographer users are missing photographer records');
      console.log('   Run fix-photographer-issues.js to create missing records');
    }
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnosis
diagnoseProductionPhotographerLogin().catch(console.error);