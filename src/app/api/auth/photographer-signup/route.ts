import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Photographer registration is currently disabled. Please contact the administrator.' },
    { status: 404 }
  )
}
