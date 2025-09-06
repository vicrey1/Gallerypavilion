import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get the cookies
    const cookieStore = await cookies()
    
    // Clear all NextAuth related cookies
    const response = NextResponse.json({ success: true, message: 'Session cleared' })
    
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
    console.error('Error clearing session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Redirect to POST for convenience
  return POST(request)
}