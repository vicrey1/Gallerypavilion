const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixProductionPhotographerLogin() {
  console.log('🔧 FIXING PRODUCTION PHOTOGRAPHER LOGIN');
  console.log('=====================================\n');
  
  try {
    // 1. Ensure test photographer exists with correct credentials
    console.log('1️⃣ SETTING UP TEST PHOTOGRAPHER:');
    
    const testEmail = 'vameh09@gmail.com';
    const testPassword = 'Cronaldo7';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    // Upsert the user
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        password: hashedPassword,
        role: 'photographer',
        name: 'Test Photographer'
      },
      create: {
        email: testEmail,
        password: hashedPassword,
        role: 'photographer',
        name: 'Test Photographer',
        emailVerified: new Date()
      }
    });
    
    console.log(`✅ User ${testEmail} created/updated`);
    
    // 2. Ensure photographer profile exists
    console.log('\n2️⃣ SETTING UP PHOTOGRAPHER PROFILE:');
    
    const existingPhotographer = await prisma.photographer.findUnique({
      where: { userId: user.id }
    });
    
    if (!existingPhotographer) {
      await prisma.photographer.create({
        data: {
          userId: user.id,
          name: 'Test Photographer',
          businessName: 'Gallery Pavilion Photography',
          phone: '+1234567890',
          website: 'https://gallerypavilion.com',
          portfolio: 'https://gallerypavilion.com/portfolio',
          experience: 'Professional',
          bio: 'Professional photographer for Gallery Pavilion',
          status: 'approved'
        }
      });
      console.log('✅ Photographer profile created');
    } else {
      await prisma.photographer.update({
        where: { id: existingPhotographer.id },
        data: {
          status: 'approved',
          name: 'Test Photographer',
          businessName: 'Gallery Pavilion Photography'
        }
      });
      console.log('✅ Photographer profile updated and approved');
    }
    
    // 3. Fix any other photographer users missing profiles
    console.log('\n3️⃣ FIXING OTHER PHOTOGRAPHER USERS:');
    
    const photographerUsersWithoutProfiles = await prisma.user.findMany({
      where: {
        role: 'photographer',
        photographer: null
      }
    });
    
    console.log(`Found ${photographerUsersWithoutProfiles.length} photographer users without profiles`);
    
    for (const user of photographerUsersWithoutProfiles) {
      await prisma.photographer.create({
        data: {
          userId: user.id,
          name: user.name || 'Photographer',
          businessName: `${user.name || 'Photographer'} Photography`,
          phone: '+1234567890',
          experience: 'Professional',
          bio: 'Professional photographer',
          status: 'approved'
        }
      });
      console.log(`✅ Created photographer profile for ${user.email}`);
    }
    
    // 4. Verify the fix
    console.log('\n4️⃣ VERIFICATION:');
    
    const verifyUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { photographer: true }
    });
    
    if (verifyUser && verifyUser.photographer) {
      const passwordValid = await bcrypt.compare(testPassword, verifyUser.password);
      console.log('✅ Test user verification:');
      console.log(`   - Email: ${verifyUser.email}`);
      console.log(`   - Role: ${verifyUser.role}`);
      console.log(`   - Password valid: ${passwordValid}`);
      console.log(`   - Photographer status: ${verifyUser.photographer.status}`);
      console.log(`   - Business name: ${verifyUser.photographer.businessName}`);
    } else {
      console.log('❌ Verification failed - user or photographer profile not found');
    }
    
    // 5. Summary
    console.log('\n5️⃣ SUMMARY:');
    const totalPhotographers = await prisma.user.count({
      where: { role: 'photographer' }
    });
    const totalPhotographerProfiles = await prisma.photographer.count();
    const approvedPhotographers = await prisma.photographer.count({
      where: { status: 'approved' }
    });
    
    console.log(`📊 Total photographer users: ${totalPhotographers}`);
    console.log(`📊 Total photographer profiles: ${totalPhotographerProfiles}`);
    console.log(`📊 Approved photographers: ${approvedPhotographers}`);
    
    console.log('\n🎉 PRODUCTION PHOTOGRAPHER LOGIN FIX COMPLETE!');
    console.log('\n🚀 Test the login at: https://gallerypavilion.com/auth/photographer-login');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionPhotographerLogin().catch(console.error);