import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Searching for user...');
    const user = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' },
      include: {
        photographer: true
      }
    });
    
    if (!user) {
      console.log('No user found with email vameh09@gmail.com');
      return;
    }
    
    console.log('User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Has password:', !!user.password);
    
    if (user.photographer) {
      console.log('\nPhotographer profile:');
      console.log('- Status:', user.photographer.status);
      console.log('- Name:', user.photographer.name);
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
