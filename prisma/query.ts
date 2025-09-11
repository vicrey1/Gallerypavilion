import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Searching for user...');
    const user = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' }
    });
    
    if (!user) {
      console.log('No user found with email vameh09@gmail.com');
      return;
    }

    const photographer = await prisma.photographer.findUnique({
      where: { userId: user.id }
    });
    
    console.log('User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Has password:', !!user.password);
    
    if (photographer) {
      console.log('\nPhotographer profile:');
      console.log('- Status:', photographer.status);
      console.log('- Name:', photographer.name);
    } else {
      console.log('\nNo photographer profile found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    // Force exit after disconnect
    process.exit(0);
  }
}

main().catch(console.error)
