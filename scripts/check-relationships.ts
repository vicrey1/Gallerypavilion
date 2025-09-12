
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'Vameh09@gmail.com';
    console.log('Looking up user:', email);

    // Minimal query - avoid `include` to prevent mismatched include types from the generated client
    const user = await prisma.user.findFirst({ where: { email } });

    console.log('User found:', !!user);
    console.log(user ?? 'No user returned');
  } catch (err) {
    console.error('Error during relationship check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
