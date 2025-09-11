const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
  try {
    // 1. Get or create photographer
    const photographer = await prisma.photographer.findFirst()
    if (!photographer) {
      console.log('No photographer found. Please create a photographer first.')
      return
    }
    
    // 2. Create test client if not exists
    const email = 'Vameh09@gmail.com'
    let client = await prisma.client.findUnique({
      where: { email }
    })

    if (!client) {
      console.log('Creating new client...')
      // First create user
      const user = await prisma.user.create({
        data: {
          email,
          name: 'Test Client',
          role: 'client'
        }
      })
      
      client = await prisma.client.create({
        data: {
          email,
          name: 'Test Client',
          userId: user.id,
          invitedBy: photographer.id
        }
      })
    }
    
    // 3. Get first gallery
    const gallery = await prisma.gallery.findFirst({
      where: { photographerId: photographer.id }
    })
    
    if (!gallery) {
      console.log('No gallery found. Please create a gallery first.')
      return
    }
    
    // 4. Create invite
    const invite = await prisma.invite.create({
      data: {
        inviteCode: 'TEST' + Math.random().toString(36).substring(7),
        galleryId: gallery.id,
        clientEmail: email,
        status: 'active'
      }
    })
    
    // 5. Link client to invite
    await prisma.clientInvite.create({
      data: {
        clientId: client.id,
        inviteId: invite.id
      }
    })
    
    console.log('Test data created successfully:', {
      client: { id: client.id, email },
      invite: { id: invite.id, code: invite.inviteCode },
      gallery: { id: gallery.id }
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
