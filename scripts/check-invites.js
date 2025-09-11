const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkInvites() {
  try {
    const invites = await prisma.invite.findMany({
      select: {
        inviteCode: true,
        clientEmail: true,
        status: true
      }
    });
    console.log('All invites:', invites);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvites();
