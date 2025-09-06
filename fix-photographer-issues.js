require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixPhotographerIssues() {
  console.log('🔧 Fixing photographer login issues...')
  
  try {
    // Issue 1: test@photographer.com has no photographer record
    console.log('\n1️⃣ Fixing test@photographer.com - creating photographer record')
    
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@photographer.com' },
      include: { photographer: true }
    })
    
    if (testUser && !testUser.photographer) {
      const photographerRecord = await prisma.photographer.create({
        data: {
          userId: testUser.id,
          name: testUser.name || 'Test Photographer',
          businessName: 'Test Photography Studio',
          status: 'approved',
          bio: 'Test photographer for development',
          website: 'https://test-photography.com'
        }
      })
      
      console.log('✅ Created photographer record:', {
        id: photographerRecord.id,
        businessName: photographerRecord.businessName,
        status: photographerRecord.status
      })
    } else if (testUser?.photographer) {
      console.log('ℹ️ Photographer record already exists for test@photographer.com')
    } else {
      console.log('❌ User test@photographer.com not found')
    }
    
    // Issue 2: Check what the correct password should be for vameh09@gmail.com
    console.log('\n2️⃣ Checking vameh09@gmail.com password')
    
    const victorUser = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' }
    })
    
    if (victorUser) {
      console.log('👤 Victor user found:')
      console.log('   Password hash:', victorUser.password.substring(0, 20) + '...')
      
      // Test common passwords
      const commonPasswords = [
        'password123',
        'password',
        '123456',
        'admin123',
        'victor123',
        'vameh09',
        'test123'
      ]
      
      console.log('🔍 Testing common passwords...')
      for (const pwd of commonPasswords) {
        const isValid = await bcrypt.compare(pwd, victorUser.password)
        if (isValid) {
          console.log(`✅ Correct password found: "${pwd}"`)
          break
        }
      }
    }
    
    // Let's also create a new test photographer with known credentials
    console.log('\n3️⃣ Creating a new test photographer with known credentials')
    
    const hashedPassword = await bcrypt.hash('testpass123', 12)
    
    // Check if user already exists
    const existingTestUser = await prisma.user.findUnique({
      where: { email: 'photographer@test.com' }
    })
    
    if (!existingTestUser) {
      const newUser = await prisma.user.create({
        data: {
          email: 'photographer@test.com',
          name: 'Test Photographer 2',
          password: hashedPassword,
          role: 'photographer'
        }
      })
      
      const newPhotographer = await prisma.photographer.create({
        data: {
          userId: newUser.id,
          name: newUser.name || 'Test Photographer 2',
          businessName: 'Test Photography 2',
          status: 'approved',
          bio: 'Another test photographer',
          website: 'https://test2-photography.com'
        }
      })
      
      console.log('✅ Created new test photographer:')
      console.log('   Email: photographer@test.com')
      console.log('   Password: testpass123')
      console.log('   Status: approved')
    } else {
      console.log('ℹ️ Test photographer photographer@test.com already exists')
    }
    
  } catch (error) {
    console.error('❌ Error fixing issues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPhotographerIssues()