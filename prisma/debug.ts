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
    const photographer = await prisma.photographer.findFirst({
      where: {
        user: {
          email: 'vameh09@gmail.com'
        }
      }
    })
    console.log('Photographer found:', photographer ? 'Yes' : 'No')
    if (photographer) {
      console.log('Photographer ID:', photographer.id)
      console.log('Status:', photographer.status)
      console.log('User ID:', photographer.userId)
    }

    // 3. Raw query to check both tables
    console.log('\nRunning raw join query...')
    const result = await prisma.$queryRaw`
      SELECT 
        User.id as userId, 
        User.email,
        User.role,
        photographers.id as photographerId,
        photographers.status,
        photographers.name
      FROM User
      LEFT JOIN photographers ON User.id = photographers.userId
      WHERE User.email = 'vameh09@gmail.com'
    `
    console.log('Raw query result:', result)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
