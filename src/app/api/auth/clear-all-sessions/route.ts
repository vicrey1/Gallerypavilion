import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear all sessions from the database
    const deletedSessions = await prisma.session.deleteMany({})
    
    // Clear all accounts (optional - this will force re-authentication)
    // const deletedAccounts = await prisma.account.deleteMany({})
    
    // Clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'All sessions cleared from database',
      deletedSessions: deletedSessions.count
    })
    
    // Clear session token cookies
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/'
    })
    
    response.cookies.set('__Secure-next-auth.session-token', '', {
      expires: new Date(0),
      path: '/'
    })
    
    // Clear CSRF token cookies
    response.cookies.set('next-auth.csrf-token', '', {
      expires: new Date(0),
      path: '/'
    })
    
    response.cookies.set('__Host-next-auth.csrf-token', '', {
      expires: new Date(0),
      path: '/'
    })
    
    // Clear callback URL cookie
    response.cookies.set('next-auth.callback-url', '', {
      expires: new Date(0),
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Error clearing all sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Redirect to POST for convenience
  return POST(request)
}