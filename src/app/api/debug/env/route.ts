import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or with secret parameter for security
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (process.env.NODE_ENV === 'production' && secret !== 'debug-env-check') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[NOT SET]',
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? '[SET]' : '[NOT SET]',
    APP_URL: process.env.APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV
  }

  return NextResponse.json({
    environment: envVars,
    timestamp: new Date().toISOString(),
    warning: 'This endpoint should only be used for debugging'
  })
}