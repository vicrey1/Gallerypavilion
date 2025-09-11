import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

async function main() {
  try {
    // 1. Check User table
    console.log('\nChecking User table...')
    const user = await prisma.user.findFirst({
      where: {
        email: 'vameh09@gmail.com'
      }
    })
    console.log('User found:', user ? 'Yes' : 'No')
    if (user) {
      console.log('User ID:', user.id)
      console.log('User Role:', user.role)
      console.log('Has Password:', !!user.password)
    }

    // 2. Check Photographer table
    console.log('\nChecking Photographer table...')
    const photographer = user ? await prisma.photographer.findUnique({
      where: {
        userId: user.id
      }
    }) : null
    console.log('Photographer found:', photographer ? 'Yes' : 'No')
    if (photographer) {
      console.log('Photographer ID:', photographer.id)
      console.log('Status:', photographer.status)
      console.log('User ID:', photographer.userId)
    }

    // 3. Get combined user and photographer data
    console.log('\nGetting combined user and photographer data...')
    if (user && photographer) {
      const combinedData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        photographerId: photographer.id,
        status: photographer.status,
        name: photographer.name
      }
      console.log('Combined data:', combinedData)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
