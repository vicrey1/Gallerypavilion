import { PrismaClient, PhotographerStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default system settings
  const defaultSettings = [
    {
      key: 'auto_approve_photographers',
      value: 'false',
      type: 'boolean',
      description: 'Automatically approve new photographer registrations'
    },
    {
      key: 'email_notifications',
      value: 'true',
      type: 'boolean',
      description: 'Send email notifications for important events'
    },
    {
      key: 'max_gallery_size',
      value: '100',
      type: 'number',
      description: 'Maximum number of photos per gallery'
    },
    {
      key: 'max_file_size',
      value: '10485760',
      type: 'number',
      description: 'Maximum file size in bytes (10MB)'
    },
    {
      key: 'allowed_file_types',
      value: 'jpg,jpeg,png,webp',
      type: 'string',
      description: 'Comma-separated list of allowed file extensions'
    }
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gallerypavilion.com' },
    update: {},
    create: {
      email: 'admin@gallerypavilion.com',
      name: 'Gallery Pavilion Admin',
      role: 'admin',
      password: hashedAdminPassword
    }
  })

  // Create a test user and photographer
  const hashedPassword = await bcrypt.hash('password123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'photographer@test.com' },
    update: {},
    create: {
      email: 'photographer@test.com',
      name: 'Test Photographer',
      role: 'photographer',
      password: hashedPassword
    }
  })

  const testPhotographer = await prisma.photographer.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      name: 'Test Photographer',
      bio: 'Professional photographer specializing in portraits and events',
      email: 'photographer@test.com',
      website: 'http://test-photography.com',
      instagram: '@testphotography',
      status: "ACTIVE"
    }
  })

  // Create test gallery
  const testGallery = await prisma.gallery.create({
    data: {
      name: 'Wedding Portfolio',
      description: 'Beautiful wedding photography collection',
      photographerId: testPhotographer.id,
      isPublic: false
    }
  });

  // Create test photo
  const testPhoto = await prisma.photo.create({
    data: {
      title: 'Ceremony Moment',
      description: 'Beautiful ceremony capture',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      photographerId: testPhotographer.id,
      galleryId: testGallery.id,
      size: 2048000,
      width: 1920,
      height: 1280,
      format: 'jpg',
      price: 25.00,
      isPublic: false,
      isFeatured: false
    }
  });

  // Create test invite
  const testInvite = await prisma.invite.create({
    data: {
      code: 'TEST123',
      email: 'client@test.com',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      galleryId: testGallery.id
    }
  });

  console.log('Database seeded successfully!')
  console.log('\n=== ADMIN CREDENTIALS ===')
  console.log('Email: admin@gallerypavilion.com')
  console.log('Password: admin123')
  console.log('Role: admin')
  console.log('\n=== TEST DATA ===')
  console.log('Test invite code: TEST123')
  console.log('Test photographer ID:', testPhotographer.id)
  console.log('Test gallery ID:', testGallery.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })