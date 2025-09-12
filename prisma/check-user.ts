import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser(email: string) {
  try {
    // Find user (without include) then load photographer explicitly to avoid
    // mismatched generated types during project-wide type checking.
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      console.log('❌ No user found with email:', email)
      return
    }

    console.log('User found:')
    console.log('- Email:', user.email)
    console.log('- Role:', user.role)
    console.log('- Has password:', !!user.password)

    // Load photographer profile by userId if present
    const photographer = await prisma.photographer.findUnique({ where: { userId: user.id } as any })

    if (photographer) {
      console.log('\nPhotographer profile:')
      console.log('- ID:', photographer.id)
      console.log('- Status:', photographer.status)
      console.log('- Name:', photographer.name)
    } else {
      console.log('\n❌ No photographer profile found')
    }
  } catch (error) {
    console.error('Error checking user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]
if (!email) {
  console.error('Please provide an email address')
  process.exit(1)
}

checkUser(email)
