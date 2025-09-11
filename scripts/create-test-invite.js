const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestInvite() {
    try {
        // First, find or create a test photographer
        let photographer = await prisma.photographer.findFirst();
        
        if (!photographer) {
            // Create a test user first
            const user = await prisma.user.create({
                data: {
                    email: 'test@photographer.com',
                    name: 'Test Photographer',
                    role: 'photographer'
                }
            });
            
            photographer = await prisma.photographer.create({
                data: {
                    userId: user.id,
                    name: 'Test Photographer',
                    status: 'approved'
                }
            });
        }

        // Create a test gallery
        const gallery = await prisma.gallery.create({
            data: {
                title: 'Test Gallery',
                description: 'A test gallery',
                photographerId: photographer.id,
                visibility: 'invite_only',
                status: 'active'
            }
        });

        // Create the test invite
        const invite = await prisma.invite.create({
            data: {
                inviteCode: 'test123',
                galleryId: gallery.id,
                clientEmail: 'test@client.com',
                status: 'active',
                canView: true,
                canRequestPurchase: true
            }
        });

        console.log('Test invite created:', invite);
    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestInvite();
