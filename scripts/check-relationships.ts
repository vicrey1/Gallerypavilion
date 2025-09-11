import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelationships() {
  try {
    const email = 'Vameh09@gmail.com';
    console.log('Looking up client:', email);
    
    const client = await prisma.client.findFirst({
      where: { email },
      include: {
        invites: {
          include: {
            invite: true
          }
        }
      }
    });
    
    console.log('Client found:', client ? 'Yes' : 'No');
    if (client) {
      console.log('Client details:', {
        id: client.id,
        email: client.email,
        name: client.name,
        inviteCount: client.invites.length
      });

      if (client.invites.length > 0) {
        for (const clientInvite of client.invites) {
          console.log('Invite details:', {
            inviteId: clientInvite.inviteId,
            inviteCode: clientInvite.invite.code,
            expiresAt: clientInvite.invite.expiresAt
          });
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationships();
