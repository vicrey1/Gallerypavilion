const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPhotographerPassword() {
  try {
    console.log('🔍 Checking photographer password hash...');
    
    const email = 'vameh09@gmail.com';
    const testPassword = 'Cronaldo7';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { photographer: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Has password:', !!user.password);
    console.log('  - Password hash length:', user.password ? user.password.length : 0);
    console.log('  - Has photographer profile:', !!user.photographer);
    
    if (user.photographer) {
      console.log('📸 Photographer profile:');
      console.log('  - Status:', user.photographer.status);
      console.log('  - Name:', user.photographer.name);
    }
    
    if (user.password) {
      console.log('\n🔐 Testing password comparison...');
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('  - Password "Cronaldo7" matches:', isValid);
      
      // Test with other common passwords
      const testPasswords = ['correctpassword123', 'password123', 'admin123'];
      for (const pwd of testPasswords) {
        const matches = await bcrypt.compare(pwd, user.password);
        console.log(`  - Password "${pwd}" matches:`, matches);
      }
      
      // Show first few characters of hash for debugging
      console.log('  - Hash starts with:', user.password.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotographerPassword();