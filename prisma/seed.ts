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
      businessName: 'Test Photography Studio',
      bio: 'Professional photographer specializing in portraits and events',
      status: 'ACTIVE'
    }
  })

  // Create a test gallery
  const testGallery = await prisma.gallery.create({
    data: {
      title: 'Wedding Portfolio',
      description: 'Beautiful wedding photography collection',
      photographerId: testPhotographer.id,
      isPublic: false
    }
  })

    // Create test photos
  const testPhotos = [
    {
      title: 'Ceremony Moment',
      description: 'Beautiful ceremony capture',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      photographerId: testPhotographer.id,
      galleryId: testGallery.id,
      price: 25.00,
      currency: 'USD',
      width: 1920,
      height: 1280,
      size: 2048000,
      format: 'jpg',
      isPublic: false,
      isFeatured: false
    },
    {
      title: 'Reception Dance',
      description: 'First dance moment',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop',
      photographerId: testPhotographer.id,
      galleryId: testGallery.id,
      price: 30.00,
      currency: 'USD',
      width: 1920,
      height: 1080,
      size: 1856000,
      format: 'jpg',
      isPublic: false,
      isFeatured: false
    },
    {
      title: 'Portrait Session',
      description: 'Couple portrait in garden',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
      photographerId: testPhotographer.id,
      galleryId: testGallery.id,
      price: 35.00,
      currency: 'USD',
      width: 1920,
      height: 1440,
      size: 2304000,
      format: 'jpg',
      isPublic: false,
      isFeatured: false
    }
  ]

  for (const photo of testPhotos) {
    await prisma.photo.create({
      data: photo
    })
  }

  // Create test invite
  const testInvite = await prisma.invite.create({
    data: {
      galleryId: testGallery.id,
      code: 'TEST123',
      email: 'client@test.com'
    }
  })

  console.log('Database seeded successfully!')
  console.log('\n=== ADMIN CREDENTIALS ===')
  console.log('Email: admin@gallerypavilion.com')
  console.log('Password: admin123')
  console.log('Role: admin')
  console.log('\n=== TEST DATA ===')
  console.log('Test invite code: TEST123')
  console.log('Test gallery ID:', testGallery.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })