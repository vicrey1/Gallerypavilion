import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync } from '@/lib/jwt'

/**
 * Return a NextAuth-compatible session object mapped from our JWT payload.
 * The client `useSession` hook expects either null or a session object.
 */
export async function GET(_request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(_request)

    if (!payload) {
      return NextResponse.json(null, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      })
    }

    // Map JWTPayload to a NextAuth-like Session shape expected by the client
    const session = {
      user: {
        id: payload.userId,
        email: payload.email,
        // name is optional — keep undefined if not present
        name: payload.name || undefined,
        role: payload.role,
      },
      // Provide an expires field to mimic NextAuth session shape
      expires: undefined,
    }

    return NextResponse.json(session, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}