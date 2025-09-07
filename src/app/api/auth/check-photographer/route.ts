import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
