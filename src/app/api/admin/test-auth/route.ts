import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found in database',
        exists: false
      })
    }

    // Test password verification (without exposing the actual password)
    const testPassword = 'admin123'
    const passwordValid = adminUser.password ? await bcrypt.compare(testPassword, adminUser.password) : false

    return NextResponse.json({
      success: true,
      message: 'Admin user found',
      exists: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        emailVerified: adminUser.emailVerified
      },
      passwordTest: {
        hasPassword: !!adminUser.password,
        testPasswordValid: passwordValid
      }
    })
  } catch (error) {
    console.error('Error testing admin auth:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection or query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}