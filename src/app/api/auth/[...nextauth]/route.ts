import { NextRequest, NextResponse } from 'next/server'

// Placeholder for legacy NextAuth catch-all route.
// During the migration to a custom JWT system this file is intentionally
// a no-op to satisfy build-time type imports that may still reference
// the original `[...]nextauth` route. It intentionally returns 404.

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function PUT(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function DELETE(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export async function PATCH(_request: NextRequest) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
