require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPhotographers() {
  try {
    console.log('🔍 Checking photographers in database...')
    
    // Get all users with photographer role
    const photographers = await prisma.user.findMany({
      where: {
        role: 'photographer'
      },
      include: {
        photographer: true
      }
    })
    
    console.log(`\n📊 Found ${photographers.length} photographer(s):`);
    
    photographers.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password ? 'SET' : 'NOT SET'}`);
      console.log(`   Password Length: ${user.password ? user.password.length : 0}`);
      console.log(`   Password Starts With: ${user.password ? user.password.substring(0, 10) + '...' : 'N/A'}`);
      
      if (user.photographer) {
        console.log(`   Photographer ID: ${user.photographer.id}`);
        console.log(`   Status: ${user.photographer.status}`);
        console.log(`   Business Name: ${user.photographer.businessName || 'N/A'}`);
      } else {
        console.log(`   ❌ No photographer record found!`);
      }
    });
    
    // Also check if there are any users without photographer role but with photographer records
    const orphanPhotographers = await prisma.photographer.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`\n🔍 Total photographer records: ${orphanPhotographers.length}`);
    
  } catch (error) {
    console.error('❌ Error checking photographers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotographers();