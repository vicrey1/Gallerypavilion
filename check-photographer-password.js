require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkPhotographerPassword() {
  try {
    console.log('Checking photographer password in database...');
    
    // Get the photographer with user details
    const photographer = await prisma.photographer.findFirst({
      include: {
        user: true
      }
    });
    
    if (!photographer) {
      console.log('❌ No photographer found in database');
      return;
    }
    
    console.log('Photographer found:');
    console.log('- ID:', photographer.id);
    console.log('- Email:', photographer.user.email);
    console.log('- Status:', photographer.status);
    console.log('- Password hash:', photographer.user.password);
    
    // Test common passwords
    const testPasswords = ['password123', 'admin123', 'test123', '123456', 'password'];
    
    console.log('\nTesting passwords against hash...');
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, photographer.user.password);
        console.log(`Password '${password}': ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        if (isValid) {
          console.log(`\n🎉 Found working password: ${password}`);
          break;
        }
      } catch (error) {
        console.log(`Error testing password '${password}':`, error.message);
      }
    }
    
    // Check if the user account is properly set up
    console.log('\nUser account details:');
    console.log('- User ID:', photographer.user.id);
    console.log('- Name:', photographer.user.name);
    console.log('- Email verified:', photographer.user.emailVerified);
    console.log('- Created at:', photographer.user.createdAt);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotographerPassword().catch(console.error);