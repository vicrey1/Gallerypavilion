import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use production database URL from environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function seedProduction() {
  try {
    console.log('🌱 Starting production database seeding...')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists in production database')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      return
    }
    
    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@gallerypavilion.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Production database seeded successfully!')
    console.log('')
    console.log('=== ADMIN CREDENTIALS ===')
    console.log('Email: admin@gallerypavilion.com')
    console.log('Password: admin123')
    console.log('Role: admin')
    console.log('User ID:', adminUser.id)
    console.log('')
    console.log('⚠️  IMPORTANT: Change the admin password after first login!')
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedProduction()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })