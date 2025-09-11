import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setupPhotographer() {
  try {
    console.log('Setting up photographer account...');
    
    const email = process.env.PHOTOGRAPHER_EMAIL;
    const password = process.env.PHOTOGRAPHER_PASSWORD;
    
    if (!email || !password) {
      console.error('❌ Missing required environment variables:');
      console.error('PHOTOGRAPHER_EMAIL and PHOTOGRAPHER_PASSWORD must be set');
      process.exit(1);
    }
    
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
          name: process.env.PHOTOGRAPHER_NAME || 'Photographer',
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
    let photographer = await prisma.photographer.findUnique({
      where: { userId: user.id }
    });
    
    if (!photographer) {
      console.log('Creating photographer profile...');
      photographer = await prisma.photographer.create({
        data: {
          userId: user.id,
          name: process.env.PHOTOGRAPHER_NAME || user.name || 'Photographer',
          businessName: process.env.PHOTOGRAPHER_BUSINESS_NAME || null,
          phone: process.env.PHOTOGRAPHER_PHONE || null,
          website: process.env.PHOTOGRAPHER_WEBSITE || null,
          portfolio: process.env.PHOTOGRAPHER_PORTFOLIO || null,
          experience: process.env.PHOTOGRAPHER_EXPERIENCE || 'Professional',
          bio: process.env.PHOTOGRAPHER_BIO || null,
          status: 'approved'
        }
      });
      console.log('Photographer profile created');
    } else {
      console.log('Photographer profile exists, updating status...');
      photographer = await prisma.photographer.update({
        where: { id: photographer.id },
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