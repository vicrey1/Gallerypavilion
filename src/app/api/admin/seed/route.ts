import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow with secret key
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // In production, require a secret key
    if (process.env.NODE_ENV === 'production' && secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or missing secret' }, { status: 401 })
    }

    console.log('🌱 Starting production database seeding...')

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return NextResponse.json({ 
        success: true,
        message: 'Admin user already exists in production database',
        admin: { 
          id: existingAdmin.id,
          email: existingAdmin.email, 
          role: existingAdmin.role
        }
      })
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
    
    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully!',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@gallerypavilion.com',
        password: 'admin123',
        loginUrl: `${process.env.NEXTAUTH_URL || process.env.APP_URL}/auth/admin-login`
      },
      warning: 'IMPORTANT: Change the admin password after first login!'
    })
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'Database seeding failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        checkDatabaseUrl: 'Verify DATABASE_URL environment variable is set correctly',
        checkPermissions: 'Ensure database user has CREATE permissions',
        checkConnection: 'Test database connectivity'
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })
    
    return NextResponse.json({
      adminExists: !!existingAdmin,
      admin: existingAdmin ? {
        id: existingAdmin.id,
        email: existingAdmin.email,
        role: existingAdmin.role
      } : null,
      message: existingAdmin ? 'Admin user exists' : 'Admin user not found',
      seedEndpoint: '/api/admin/seed (POST with ?secret=YOUR_SECRET)'
    })
    
  } catch (error) {
    console.error('Error checking admin user:', error)
    return NextResponse.json({ 
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}