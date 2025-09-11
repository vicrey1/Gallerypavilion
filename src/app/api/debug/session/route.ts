import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString(),
      headers: {
        cookie: request.headers.get('cookie'),
        userAgent: request.headers.get('user-agent')
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET
      }
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}