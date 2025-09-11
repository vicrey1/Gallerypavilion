const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking database contents...')
    
    const photographers = await prisma.photographer.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    console.log('Photographers found:', photographers.length)
    photographers.forEach(p => {
      console.log(`- ID: ${p.id}, Email: ${p.user.email} (${p.status})`)
    })
    
    const galleries = await prisma.gallery.findMany({
      include: {
        photographer: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })
    
    console.log('\nGalleries found:', galleries.length)
    galleries.forEach(g => {
      console.log(`- ID: ${g.id}, Title: ${g.title} by ${g.photographer.user.email} (${g.status})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()