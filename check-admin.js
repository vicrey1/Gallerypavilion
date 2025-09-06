const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    });
    
    if (user) {
      console.log('✅ Admin user found:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Has Password:', !!user.password);
      console.log('   Created:', user.createdAt);
    } else {
      console.log('❌ Admin user NOT FOUND');
      console.log('   Need to run seed script to create admin user');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();