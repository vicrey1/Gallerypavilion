export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  secret: z.string()
})

// WARNING: This is a temporary debug endpoint. Protect it with DEBUG_RESET_SECRET
// in your Vercel environment and remove it after debugging.
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEBUG_RESET_SECRET) {
      return NextResponse.json({ error: 'Debug reset not enabled' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { email, newPassword, secret } = parsed.data
    if (secret !== process.env.DEBUG_RESET_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Debug reset error', e)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
