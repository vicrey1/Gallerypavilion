import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Safe debug: decode the _vercel_jwt (no signature verification) and return
// only the claim keys and whether a local user exists that matches an email-like claim.
export async function GET(request: NextRequest) {
  try {
    const vercelCookie = request.cookies.get('_vercel_jwt')
    if (!vercelCookie) {
      return NextResponse.json({ present: false }, { status: 200 })
    }

    const token = vercelCookie.value
    const decoded = jwt.decode(token) as Record<string, unknown> | null
    if (!decoded) {
      return NextResponse.json({ present: true, claimKeys: [], mappedUser: false }, { status: 200 })
    }

    const claimKeys = Object.keys(decoded)

    // Try to find an email-like claim and check whether a local user exists.
    const emailCandidate = (decoded['email'] || decoded['email_address'] || decoded['sub'] || decoded['userId']) as string | undefined
    let mappedUser = false
    if (emailCandidate) {
      try {
        const normalized = String(emailCandidate).toLowerCase()
        const user = await prisma.user.findUnique({ where: { email: normalized } })
        mappedUser = !!user
      } catch (e) {
        // ignore DB errors in debug endpoint
      }
    }

    return NextResponse.json({ present: true, claimKeys, mappedUser }, { status: 200 })
  } catch (error) {
    console.error('debug/token-info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
