import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'diagnose'
    const secret = searchParams.get('secret')
    
    // Security check for production
    if (process.env.NODE_ENV === 'production' && secret !== process.env.DEBUG_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const results: any = {
      timestamp: new Date().toISOString(),
      action,
      environment: process.env.NODE_ENV,
      checks: {}
    }
    
    // 1. Environment Variables Check
    results.checks.environment = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV
    }
    
    // 2. Database Connection Test
    try {
      await prisma.$connect()
      const userCount = await prisma.user.count()
      results.checks.database = {
        status: 'CONNECTED',
        totalUsers: userCount
      }
    } catch (dbError: any) {
      results.checks.database = {
        status: 'FAILED',
        error: dbError.message
      }
      return NextResponse.json(results, { status: 500 })
    }
    
    // 3. Photographer Records Check
    const photographerUsers = await prisma.user.findMany({
      where: { role: 'photographer' },
      include: { photographer: true }
    })
    
    results.checks.photographers = {
      totalPhotographerUsers: photographerUsers.length,
      users: photographerUsers.map(user => ({
        email: user.email,
        id: user.id,
        name: user.name,
        hasPassword: !!user.password,
        emailVerified: !!user.emailVerified,
        hasPhotographerRecord: !!user.photographer,
        photographerStatus: user.photographer?.status || 'NO_RECORD',
        businessName: user.photographer?.businessName || 'NOT_SET'
      }))
    }
    
    // 4. Test Specific Photographer
    const testEmail = 'vameh09@gmail.com'
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { photographer: true }
    })
    
    results.checks.testPhotographer = {
      email: testEmail,
      exists: !!testUser,
      hasPassword: testUser ? !!testUser.password : false,
      role: testUser?.role || 'NOT_FOUND',
      hasPhotographerRecord: testUser ? !!testUser.photographer : false,
      photographerStatus: testUser?.photographer?.status || 'NO_RECORD'
    }
    
    // 5. If action is 'fix', attempt to fix issues
    if (action === 'fix') {
      const fixes: any = []
      
      // Fix test photographer
      const testPassword = 'Cronaldo7'
      const hashedPassword = await bcrypt.hash(testPassword, 12)
      
      const fixedUser = await prisma.user.upsert({
        where: { email: testEmail },
        update: {
          password: hashedPassword,
          role: 'photographer',
          name: 'Test Photographer'
        },
        create: {
          email: testEmail,
          password: hashedPassword,
          role: 'photographer',
          name: 'Test Photographer',
          emailVerified: new Date()
        }
      })
      
      fixes.push(`User ${testEmail} created/updated`)
      
      // Ensure photographer profile exists
      const existingPhotographer = await prisma.photographer.findUnique({
        where: { userId: fixedUser.id }
      })
      
      if (!existingPhotographer) {
        await prisma.photographer.create({
          data: {
            userId: fixedUser.id,
            name: 'Test Photographer',
            businessName: 'Gallery Pavilion Photography',
            phone: '+1234567890',
            website: 'https://gallerypavilion.com',
            portfolio: 'https://gallerypavilion.com/portfolio',
            experience: 'Professional',
            bio: 'Professional photographer for Gallery Pavilion',
            status: 'approved'
          }
        })
        fixes.push('Photographer profile created')
      } else {
        await prisma.photographer.update({
          where: { id: existingPhotographer.id },
          data: {
            status: 'approved',
            name: 'Test Photographer',
            businessName: 'Gallery Pavilion Photography'
          }
        })
        fixes.push('Photographer profile updated and approved')
      }
      
      // Fix other photographer users missing profiles
      const photographerUsersWithoutProfiles = await prisma.user.findMany({
        where: {
          role: 'photographer',
          photographer: null
        }
      })
      
      for (const user of photographerUsersWithoutProfiles) {
        await prisma.photographer.create({
          data: {
            userId: user.id,
            name: user.name || 'Photographer',
            businessName: `${user.name || 'Photographer'} Photography`,
            phone: '+1234567890',
            experience: 'Professional',
            bio: 'Professional photographer',
            status: 'approved'
          }
        })
        fixes.push(`Created photographer profile for ${user.email}`)
      }
      
      results.fixes = fixes
    }
    
    // 6. Recommendations
    const recommendations: string[] = []
    
    if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_URL.includes('gallerypavilion.com')) {
      recommendations.push('Set NEXTAUTH_URL to: https://gallerypavilion.com')
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      recommendations.push('Set NEXTAUTH_SECRET in Vercel environment variables')
    }
    
    if (photographerUsers.length === 0) {
      recommendations.push('No photographer users found - run seeding script')
    }
    
    const usersWithoutPhotographerRecord = photographerUsers.filter(u => !u.photographer)
    if (usersWithoutPhotographerRecord.length > 0) {
      recommendations.push(`${usersWithoutPhotographerRecord.length} photographer users missing photographer records`)
    }
    
    results.recommendations = recommendations
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  // Redirect POST to GET with action=fix
  const url = new URL(request.url)
  url.searchParams.set('action', 'fix')
  return GET(new NextRequest(url.toString()))
}