import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'All cookies cleared',
      clearedCookies: allCookies.map(c => c.name)
    })
    
    // Clear all NextAuth related cookies
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'next-auth.pkce.code_verifier'
    ]
    
    // Clear NextAuth cookies
    nextAuthCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/'
      })
    })
    
    // Also clear any other session-related cookies found
    allCookies.forEach(cookie => {
      if (cookie.name.includes('next-auth') || cookie.name.includes('session')) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/'
        })
      }
    })
    
    return response
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cookies' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to clear cookies' })
}