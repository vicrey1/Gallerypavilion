const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupPhotographer() {
  try {
    console.log('Setting up photographer account...');
    
    const email = 'vameh09@gmail.com';
    const password = 'correctpassword123';
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { photographer: true }
    });
    
    if (!user) {
      console.log('Creating new user...');
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Test Photographer',
          role: 'photographer'
        }
      });
      
      console.log('User created:', user.email);
    } else {
      console.log('User already exists, updating password...');
      // Update password
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'photographer'
        }
      });
    }
    
    // Check if photographer profile exists
    if (!user.photographer) {
      console.log('Creating photographer profile...');
      await prisma.photographer.create({
        data: {
          userId: user.id,
          name: 'Test Photographer',
          businessName: 'Test Photography Business',
          phone: '+1234567890',
          website: 'https://testphotographer.com',
          portfolio: 'https://portfolio.testphotographer.com',
          experience: 'Professional',
          specialization: 'Wedding Photography',
          bio: 'Professional photographer with years of experience',
          status: 'approved'
        }
      });
      console.log('Photographer profile created');
    } else {
      console.log('Photographer profile exists, updating status...');
      await prisma.photographer.update({
        where: { id: user.photographer.id },
        data: {
          status: 'approved'
        }
      });
    }
    
    console.log('✅ Photographer setup complete!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Status: approved');
    
  } catch (error) {
    console.error('Error setting up photographer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPhotographer();