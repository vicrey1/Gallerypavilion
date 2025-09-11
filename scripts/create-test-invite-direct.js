import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestInvite() {
  try {
    // First create a gallery
    const gallery = await prisma.gallery.create({
      data: {
        title: 'Test Gallery',
        photographerId: 'cmfdxaapn0008ie7s5lf59j6f', // Real photographer ID
        visibility: 'invite_only',
        status: 'active',
      }
    });

    // Create a test invite
    const invite = await prisma.invite.create({
      data: {
        inviteCode: 'TESTINV123',
        status: 'active',
        clientEmail: 'test@example.com',
        galleryId: gallery.id,
        canView: true,
        canRequestPurchase: true
      }
    });

    console.log('Created test invite:', invite);
  } catch (error) {
    console.error('Error creating test invite:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInvite();
