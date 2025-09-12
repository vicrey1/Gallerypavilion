import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser(email: string) {
  try {
    // Find user and associated photographer profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        photographer: true
      }
    })

    if (!user) {
      console.log('❌ No user found with email:', email)
      return
    }

    console.log('User found:')
    console.log('- Email:', user.email)
    console.log('- Role:', user.role)
    console.log('- Has password:', !!user.password)
    
    if (user.photographer) {
      console.log('\nPhotographer profile:')
      console.log('- ID:', user.photographer.id)
      console.log('- Status:', user.photographer.status)
      console.log('- Name:', user.photographer.name)
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
