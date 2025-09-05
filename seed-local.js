const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@gallerypavilion.com',
        name: 'System Administrator',
        role: 'admin',
        password: hashedPassword,
        emailVerified: new Date()
      }
    })

    console.log('Admin user created successfully:', adminUser.email)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()