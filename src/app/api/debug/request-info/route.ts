import { NextRequest, NextResponse } from 'next/server'

// Safe debug endpoint: returns only header names and cookie names, never header or cookie values.
// Use this in production to confirm whether cookies or authorization headers arrive at the server.
export async function GET(request: NextRequest) {
  try {
    const headerNames = Array.from(request.headers.keys())
    const hasAuthHeader = !!request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieNames = cookieHeader
      .split(';')
      .map((c) => c.split('=')[0].trim())
      .filter(Boolean)

    // Minimal, non-sensitive response
    return NextResponse.json(
      {
        headerNames,
        hasAuthHeader,
        cookieNames,
        host: request.headers.get('host') || null,
        userAgent: request.headers.get('user-agent') || null
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('debug/request-info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
