const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking database...')
    const user = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' },
      include: { photographer: true }
    })
    
    if (user) {
      console.log('\nUser found:')
      console.log(`Email: ${user.email}`)
      console.log(`Role: ${user.role}`)
      console.log(`Has password: ${!!user.password}`)
      
      if (user.photographer) {
        console.log('\nPhotographer profile:')
        console.log(`Status: ${user.photographer.status}`)
        console.log(`Name: ${user.photographer.name}`)
      }
    } else {
      console.log('No user found with that email')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
