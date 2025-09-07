import { PrismaClient } from '@prisma/client'
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
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const _adminUser = await prisma.user.upsert({
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
  const _testUser = await prisma.user.upsert({
    where: { email: 'photographer@test.com' },
    update: {},
    create: {
      email: 'photographer@test.com',
      name: 'Test Photographer',
      role: 'photographer',
      password: hashedPassword
    }
  })

  const _testPhotographer = await prisma.photographer.upsert({
    where: { userId: _testUser.id },
    update: {},
    create: {
      userId: _testUser.id,
      name: 'Test Photographer',
      businessName: 'Test Photography Studio',
      bio: 'Professional photographer specializing in portraits and events',
      status: 'approved'
    }
  })

  // Create a test gallery
  const _testGallery = await prisma.gallery.upsert({
    where: { id: 'test-gallery-1' },
    update: {},
    create: {
      id: 'test-gallery-1',
      title: 'Wedding Portfolio',
      description: 'Beautiful wedding photography collection',
      photographerId: _testPhotographer.id,
      visibility: 'private',
      status: 'active',
      isPublic: false,
      allowDownloads: true
    }
  })

  // Create test photos
  const testPhotos = [
    {
      id: 'photo-1',
      filename: 'wedding-1.jpg',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      title: 'Ceremony Moment',
      description: 'Beautiful ceremony capture',
      tags: ['wedding', 'ceremony', 'romantic'],
      price: 25.0,
      isForSale: true,
      isPrivate: false,
      galleryId: _testGallery.id,
      fileSize: 2048000,
      width: 1920,
      height: 1280,
      mimeType: 'image/jpeg'
    },
    {
      id: 'photo-2',
      filename: 'wedding-2.jpg',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop',
      title: 'Reception Dance',
      description: 'First dance moment',
      tags: ['wedding', 'reception', 'dance'],
      price: 30.0,
      isForSale: true,
      isPrivate: false,
      galleryId: _testGallery.id,
      fileSize: 1856000,
      width: 1920,
      height: 1080,
      mimeType: 'image/jpeg'
    },
    {
      id: 'photo-3',
      filename: 'wedding-3.jpg',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
      title: 'Portrait Session',
      description: 'Couple portrait in garden',
      tags: ['wedding', 'portrait', 'outdoor'],
      price: 35.0,
      isForSale: true,
      isPrivate: false,
      galleryId: _testGallery.id,
      fileSize: 2304000,
      width: 1920,
      height: 1440,
      mimeType: 'image/jpeg'
    }
  ]

  for (const photo of testPhotos) {
    await prisma.photo.upsert({
      where: { id: photo.id },
      update: {},
      create: photo
    })
  }
  // Create test invite
  const _testInvite = await prisma.invite.upsert({
    where: { inviteCode: 'TEST123' },
    update: {},
    create: {
      inviteCode: 'TEST123',
  galleryId: _testGallery.id,
      clientEmail: 'client@test.com',
      type: 'multi_use',
      status: 'active',
      maxUsage: 10,
      usageCount: 0,
      canView: true,
      canFavorite: true,
      canComment: true,
      canDownload: true,
      canRequestPurchase: true
    }
  })

  console.log('Database seeded successfully!')
  console.log('\n=== ADMIN CREDENTIALS ===')
  console.log('Email: admin@gallerypavilion.com')
  console.log('Password: admin123')
  console.log('Role: admin')
  console.log('\n=== TEST DATA ===')
  console.log('Test invite code: TEST123')
  console.log('Test gallery ID:', _testGallery.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })