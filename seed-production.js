const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
})

async function seedProduction() {
  try {
    console.log('🌱 Starting production database seeding...')
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:')
      console.log('   Email:', existingAdmin.email)
      console.log('   Role:', existingAdmin.role)
      console.log('   ID:', existingAdmin.id)
      return
    }
    
    // Create admin user
    console.log('Creating admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@gallerypavilion.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('   Email: admin@gallerypavilion.com')
    console.log('   Password: admin123')
    console.log('   Role:', adminUser.role)
    console.log('   ID:', adminUser.id)
    console.log('')
    console.log('🔗 Login URL: https://gallerypavilion.com/auth/admin-login')
    console.log('')
    console.log('⚠️  IMPORTANT: Change the admin password after first login!')
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedProduction()