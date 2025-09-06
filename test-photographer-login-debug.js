require('dotenv').config({ path: '.env.local' })
const { signIn } = require('next-auth/react')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Test credentials
const testCredentials = [
  {
    email: 'test@photographer.com',
    password: 'password123'
  },
  {
    email: 'vameh09@gmail.com', 
    password: 'password123'
  }
]

async function testPhotographerLogin() {
  console.log('🧪 Testing photographer login flow...')
  
  for (const creds of testCredentials) {
    console.log(`\n🔍 Testing login for: ${creds.email}`)
    
    try {
      // First, let's manually check what the authorize function would do
      console.log('📋 Manual authorization check:')
      
      const user = await prisma.user.findUnique({
        where: { email: creds.email },
        include: {
          photographer: true
        }
      })
      
      if (!user) {
        console.log('❌ User not found')
        continue
      }
      
      console.log('👤 User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        hasPhotographerRecord: !!user.photographer,
        photographerStatus: user.photographer?.status
      })
      
      if (!user.password) {
        console.log('❌ No password set')
        continue
      }
      
      // Test password
      const isValidPassword = await bcrypt.compare(creds.password, user.password)
      console.log('🔐 Password valid:', isValidPassword)
      
      if (!isValidPassword) {
        console.log('❌ Invalid password')
        continue
      }
      
      if (!user.photographer) {
        console.log('❌ No photographer record - THIS IS THE ISSUE!')
        console.log('💡 Solution: Create photographer record for this user')
        continue
      }
      
      if (user.photographer.status !== 'approved') {
        console.log('❌ Photographer not approved, status:', user.photographer.status)
        continue
      }
      
      console.log('✅ Manual check passed - login should work')
      
    } catch (error) {
      console.error('❌ Error during manual check:', error.message)
    }
  }
  
  await prisma.$disconnect()
}

testPhotographerLogin().catch(console.error)