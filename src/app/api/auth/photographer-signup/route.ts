import { NextRequest, NextResponse } from 'next/server'

// Thin proxy to the main signup handler to keep routes consistent.
// This avoids duplication in client pages that post to /api/auth/photographer-signup.
export async function POST(request: NextRequest) {
  try {
    // Forward the request body to /api/auth/signup
    const body = await request.json()
    const resp = await fetch(`${request.nextUrl.origin}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e) {
    console.error('photographer-signup proxy error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
