require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestPhotographer() {
  try {
    console.log('Creating test photographer account...');
    
    const testEmail = 'test@photographer.com';
    const testPassword = 'password123';
    const testName = 'Test Photographer';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('Password hashed successfully');
    
    // Check if photographer already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (existingUser) {
      console.log('Test photographer already exists. Updating password...');
      
      // Update the password
      await prisma.user.update({
        where: { email: testEmail },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password updated for existing test photographer');
    } else {
      // Create new user and photographer
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: testName,
          password: hashedPassword,
          emailVerified: new Date()
        }
      });
      
      const photographer = await prisma.photographer.create({
        data: {
          userId: user.id,
          name: testName,
          status: 'approved',
          bio: 'Test photographer account for development'
        }
      });
      
      console.log('✅ Test photographer created successfully:');
      console.log('- Email:', testEmail);
      console.log('- Password:', testPassword);
      console.log('- User ID:', user.id);
      console.log('- Photographer ID:', photographer.id);
    }
    
    // Also update the existing photographer's password to a known value
    console.log('\nUpdating existing photographer password...');
    const existingPhotographer = await prisma.photographer.findFirst({
      include: { user: true }
    });
    
    if (existingPhotographer && existingPhotographer.user.email !== testEmail) {
      await prisma.user.update({
        where: { id: existingPhotographer.user.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Updated existing photographer password:');
      console.log('- Email:', existingPhotographer.user.email);
      console.log('- Password:', testPassword);
    }
    
    // List all photographers
    console.log('\n--- All Photographers ---');
    const allPhotographers = await prisma.photographer.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    allPhotographers.forEach(p => {
      console.log(`- Email: ${p.user.email}, Status: ${p.status}, Name: ${p.user.name}`);
    });
    
    console.log('\n🎉 Test photographer setup complete!');
    console.log('You can now login with:');
    console.log('Email: test@photographer.com');
    console.log('Password: password123');
    console.log('OR');
    if (existingPhotographer) {
      console.log('Email:', existingPhotographer.user.email);
      console.log('Password: password123');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPhotographer().catch(console.error);