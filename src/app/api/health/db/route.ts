import { NextResponse } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple lightweight check
    try {
      await withPrismaRetry(() => prisma.$queryRaw`SELECT 1`)
    } catch (dbErr) {
      console.error('DB health check failed:', dbErr)
      return NextResponse.json({ healthy: false, error: 'DB unavailable' }, { status: 503 })
    }
    return NextResponse.json({ healthy: true }, { status: 200 })
  } catch (e) {
    console.error('DB health check failed:', e)
    return NextResponse.json({ healthy: false, error: String(e) }, { status: 503 })
  }
}
