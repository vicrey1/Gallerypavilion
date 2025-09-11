import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelationships() {
  try {
    const email = 'Vameh09@gmail.com';
    console.log('Looking up client:', email);
    
    const client = await prisma.client.findFirst({
      where: { email },
      include: {
        clientInvites: true,
        user: true
      }
    });
    
    console.log('Client found:', client ? 'Yes' : 'No');
    if (client) {
      console.log('Client details:', {
        id: client.id,
        email: client.email,
        name: client.name,
        inviteCount: client.clientInvites.length
      });

      if (client.clientInvites.length > 0) {
        const invites = await prisma.clientInvite.findMany({
          where: { clientId: client.id },
          include: {
            invite: {
              include: {
                gallery: true
              }
            }
          }
        });
        console.log('Invites:', JSON.stringify(invites, null, 2));
      } else {
        console.log('No invites found for this client');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationships();
