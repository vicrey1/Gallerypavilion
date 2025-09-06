const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createProductionPhotographer() {
  try {
    console.log('🚀 Starting production photographer seeding...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL set:', process.env.DATABASE_URL ? 'YES' : 'NO');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if photographer already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@photographer.com' },
      include: { photographer: true }
    });
    
    if (existingUser) {
      console.log('📋 Existing user found:', {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        hasPhotographer: !!existingUser.photographer
      });
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          password: hashedPassword,
          role: 'PHOTOGRAPHER'
        }
      });
      console.log('✅ Updated existing user password and role');
      
      // Ensure photographer profile exists
      if (!existingUser.photographer) {
        const photographer = await prisma.photographer.create({
          data: {
            userId: existingUser.id,
            businessName: 'Test Photography Studio',
            contactEmail: 'test@photographer.com',
            phone: '+1-555-0123',
            website: 'https://testphotography.com',
            bio: 'Professional photographer for testing purposes',
            specialties: ['Portrait', 'Wedding', 'Event'],
            experience: 5,
            equipment: ['Canon EOS R5', 'Sony A7R IV', 'Professional Lighting'],
            portfolio: ['https://example.com/portfolio1.jpg'],
            status: 'APPROVED',
            pricing: {
              hourlyRate: 150,
              packageDeals: ['Wedding Package: $2000', 'Portrait Session: $300']
            },
            availability: {
              weekdays: true,
              weekends: true,
              evenings: true
            }
          }
        });
        console.log('✅ Created photographer profile:', photographer.id);
      } else {
        // Update photographer status to approved
        await prisma.photographer.update({
          where: { id: existingUser.photographer.id },
          data: { status: 'APPROVED' }
        });
        console.log('✅ Updated photographer status to APPROVED');
      }
    } else {
      console.log('👤 Creating new photographer user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Create user with photographer profile
      const user = await prisma.user.create({
        data: {
          email: 'test@photographer.com',
          password: hashedPassword,
          name: 'Test Photographer',
          role: 'PHOTOGRAPHER',
          emailVerified: new Date(),
          photographer: {
            create: {
              businessName: 'Test Photography Studio',
              contactEmail: 'test@photographer.com',
              phone: '+1-555-0123',
              website: 'https://testphotography.com',
              bio: 'Professional photographer for testing purposes',
              specialties: ['Portrait', 'Wedding', 'Event'],
              experience: 5,
              equipment: ['Canon EOS R5', 'Sony A7R IV', 'Professional Lighting'],
              portfolio: ['https://example.com/portfolio1.jpg'],
              status: 'APPROVED',
              pricing: {
                hourlyRate: 150,
                packageDeals: ['Wedding Package: $2000', 'Portrait Session: $300']
              },
              availability: {
                weekdays: true,
                weekends: true,
                evenings: true
              }
            }
          }
        },
        include: {
          photographer: true
        }
      });
      
      console.log('✅ Created new photographer user:', {
        userId: user.id,
        email: user.email,
        photographerId: user.photographer?.id
      });
    }
    
    // Verify the setup
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'test@photographer.com' },
      include: { photographer: true }
    });
    
    if (verifyUser && verifyUser.photographer) {
      console.log('\n🎉 Production photographer setup completed!');
      console.log('📧 Email: test@photographer.com');
      console.log('🔑 Password: password123');
      console.log('👤 User ID:', verifyUser.id);
      console.log('📸 Photographer ID:', verifyUser.photographer.id);
      console.log('✅ Status:', verifyUser.photographer.status);
      
      // Test password verification
      const passwordMatch = await bcrypt.compare('password123', verifyUser.password);
      console.log('🔐 Password verification:', passwordMatch ? 'PASS' : 'FAIL');
      
      return {
        success: true,
        user: {
          id: verifyUser.id,
          email: verifyUser.email,
          role: verifyUser.role
        },
        photographer: {
          id: verifyUser.photographer.id,
          status: verifyUser.photographer.status,
          businessName: verifyUser.photographer.businessName
        }
      };
    } else {
      throw new Error('Failed to verify photographer setup');
    }
    
  } catch (error) {
    console.error('💥 Error creating production photographer:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Also create an admin user for testing
async function createProductionAdmin() {
  try {
    console.log('\n👑 Creating admin user...');
    
    await prisma.$connect();
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    });
    
    if (existingAdmin) {
      // Update password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { 
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ Updated existing admin password');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@gallerypavilion.com',
          password: hashedPassword,
          name: 'Gallery Pavilion Admin',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      console.log('✅ Created new admin user:', admin.id);
    }
    
    console.log('📧 Admin Email: admin@gallerypavilion.com');
    console.log('🔑 Admin Password: admin123');
    
  } catch (error) {
    console.error('💥 Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('🌟 Gallery Pavilion Production Setup');
    console.log('=====================================\n');
    
    const result = await createProductionPhotographer();
    await createProductionAdmin();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Try logging in at: https://www.gallerypavilion.com/auth/photographer-login');
    console.log('2. Use credentials: test@photographer.com / password123');
    console.log('3. Admin login at: https://www.gallerypavilion.com/auth/admin-login');
    console.log('4. Admin credentials: admin@gallerypavilion.com / admin123');
    
    return result;
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createProductionPhotographer, createProductionAdmin };