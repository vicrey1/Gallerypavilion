require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVamehDatabase() {
  console.log('🔍 Checking vameh09@gmail.com in local database...');
  console.log('=' .repeat(60));
  
  const targetEmail = 'vameh09@gmail.com';
  
  try {
    // Check if user exists
    console.log('\n1️⃣ Searching for user in database...');
    const user = await prisma.user.findUnique({
      where: {
        email: targetEmail
      },
      include: {
        photographer: true
      }
    });
    
    if (user) {
      console.log('✅ USER FOUND:');
      console.log('=' .repeat(40));
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.name || 'Not set');
      console.log('🔑 Role:', user.role);
      console.log('🔐 Has Password:', !!user.password);
      console.log('📅 Created:', user.createdAt);
      console.log('🔄 Updated:', user.updatedAt);
      
      if (user.photographer) {
        console.log('\n📸 PHOTOGRAPHER RECORD FOUND:');
        console.log('=' .repeat(40));
        console.log('🆔 ID:', user.photographer.id);
        console.log('🏢 Business Name:', user.photographer.businessName || 'Not set');
        console.log('📱 Phone:', user.photographer.phone || 'Not set');
        console.log('🌐 Website:', user.photographer.website || 'Not set');
        console.log('📊 Status:', user.photographer.status);
        console.log('📅 Created:', user.photographer.createdAt);
        console.log('🔄 Updated:', user.photographer.updatedAt);
        
        // Check status
        if (user.photographer.status === 'approved') {
          console.log('\n✅ STATUS: APPROVED');
          console.log('💡 This user should be able to login to the dashboard');
        } else {
          console.log(`\n❌ STATUS: ${user.photographer.status.toUpperCase()}`);
          console.log('💡 This user cannot login until approved');
        }
      } else {
        console.log('\n❌ NO PHOTOGRAPHER RECORD');
        console.log('💡 User exists but has no photographer profile');
      }
      
      // Test password verification
      console.log('\n2️⃣ Testing password verification...');
      const bcrypt = require('bcryptjs');
      const testPasswords = ['password123', 'Password123', '123456', 'password'];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          if (isValid) {
            console.log(`✅ Password '${testPassword}' is CORRECT`);
            break;
          } else {
            console.log(`❌ Password '${testPassword}' is incorrect`);
          }
        } catch (error) {
          console.log(`💥 Error testing password '${testPassword}':`, error.message);
        }
      }
      
    } else {
      console.log('❌ USER NOT FOUND');
      console.log('💡 The email vameh09@gmail.com does not exist in the database');
      
      // Search for similar emails
      console.log('\n🔍 Searching for similar emails...');
      const similarUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: 'vameh'
          }
        },
        select: {
          email: true,
          name: true,
          role: true,
          photographer: {
            select: {
              status: true
            }
          }
        }
      });
      
      if (similarUsers.length > 0) {
        console.log('📧 Found similar emails:');
        similarUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - Photographer: ${user.photographer?.status || 'No record'}`);
        });
      } else {
        console.log('📧 No similar emails found');
      }
    }
    
    // Check all photographers
    console.log('\n3️⃣ Checking all photographers in database...');
    const allPhotographers = await prisma.photographer.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total photographers: ${allPhotographers.length}`);
    
    if (allPhotographers.length > 0) {
      console.log('\n📋 Recent photographers:');
      allPhotographers.slice(0, 5).forEach((photographer, index) => {
        console.log(`   ${index + 1}. ${photographer.user.email} - ${photographer.status} (${photographer.businessName || 'No business name'})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkVamehDatabase().catch(console.error);