import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find photographer by email
    const photographer = await prisma.photographer.findFirst({
      where: {
        user: {
          email: email.toLowerCase()
        }
      },
      include: {
        user: true
      }
    })
    
    if (!photographer) {
      return NextResponse.json(
        { error: 'No photographer account found with this email address' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      exists: true,
      status: photographer.status,
      name: photographer.name
    })
    
  } catch (error) {
    console.error('Check photographer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}