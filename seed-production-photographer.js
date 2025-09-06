const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedProductionPhotographer() {
  try {
    console.log('🌱 Seeding production photographer account...');
    
    const email = 'vameh09@gmail.com';
    const password = 'Cronaldo7'; // Use the actual password the user is trying
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { photographer: true }
    });
    
    if (!user) {
      console.log('👤 Creating new user...');
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Professional Photographer',
          role: 'photographer'
        }
      });
      
      console.log('✅ User created:', user.email);
    } else {
      console.log('👤 User exists, updating password...');
      // Update password
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'photographer'
        }
      });
      console.log('✅ Password updated for:', user.email);
    }
    
    // Check if photographer profile exists
    if (!user.photographer) {
      console.log('📸 Creating photographer profile...');
      await prisma.photographer.create({
        data: {
          userId: user.id,
          name: 'Professional Photographer',
          businessName: 'Gallery Pavilion Photography',
          phone: '+1234567890',
          website: 'https://gallerypavilion.com',
          portfolio: 'https://gallerypavilion.com/portfolio',
          experience: 'Professional',
          bio: 'Professional photographer specializing in high-quality gallery work',
          status: 'approved'
        }
      });
      console.log('✅ Photographer profile created');
    } else {
      console.log('📸 Photographer profile exists, ensuring approved status...');
      await prisma.photographer.update({
        where: { id: user.photographer.id },
        data: {
          status: 'approved'
        }
      });
      console.log('✅ Photographer status set to approved');
    }
    
    console.log('\n🎉 Production photographer setup complete!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('✅ Status: approved');
    console.log('\n🚀 The photographer can now login at: https://gallerypavilion.com/auth/photographer-login');
    
  } catch (error) {
    console.error('❌ Error setting up production photographer:', error);
    if (error.code === 'P2002') {
      console.log('💡 This might be a unique constraint error. The user might already exist.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedProductionPhotographer();