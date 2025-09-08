import { NextRequest, NextResponse } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/jwt'
import { z } from 'zod'
import { createNotification, NotificationTemplates } from '@/lib/notifications'

const inviteSchema = z.object({
  type: z.enum(['single_use', 'multi_use', 'time_limited']).default('single_use'),
  expiresAt: z.string().optional(),
  permissions: z.object({
    canView: z.boolean().default(true),
    canFavorite: z.boolean().default(true),
    canComment: z.boolean().default(false),
    canDownload: z.boolean().default(false),
    canRequestPurchase: z.boolean().default(true),
  }).optional().default(() => ({ canView: true, canFavorite: true, canComment: false, canDownload: false, canRequestPurchase: true })),
})

// POST /api/photographer/galleries/[id]/invites - create invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getUserFromRequestAsync(request)

    if (!payload?.photographerId) {
      return NextResponse.json({ error: 'Unauthorized - Photographer access required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = inviteSchema.parse(body)
    const galleryId = id

    // Verify the gallery belongs to the photographer
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: galleryId, photographerId: payload.photographerId } }))
    } catch (dbErr) {
      console.error('DB error verifying gallery in /api/photographer/galleries/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Create the invite
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.create({ data: { inviteCode, galleryId, clientEmail: null, type: validatedData.type, expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null, maxUsage: validatedData.type === 'single_use' ? 1 : null, usageCount: 0, canView: validatedData.permissions?.canView ?? true, canFavorite: validatedData.permissions?.canFavorite ?? true, canComment: validatedData.permissions?.canComment ?? false, canDownload: validatedData.permissions?.canDownload ?? false, canRequestPurchase: validatedData.permissions?.canRequestPurchase ?? true, status: 'active' } }))
    } catch (dbErr) {
      console.error('DB error creating invite in /api/photographer/galleries/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Resolve base URL for invite links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.APP_URL || 'http://localhost:3000'

    // Notify photographer that invitation was created (best-effort)
    try {
      const photographerUserId = payload.userId
      const notificationTemplate = NotificationTemplates.inviteSent('Invite created', gallery.title)
      await createNotification({
        ...notificationTemplate,
        userId: photographerUserId,
        data: { inviteId: invite.id, galleryId: gallery.id, inviteCode: invite.inviteCode },
      })
    } catch (notificationError) {
      console.warn('Failed to create photographer notification:', notificationError)
    }

    return NextResponse.json({ id: invite.id, inviteCode: invite.inviteCode, type: invite.type, expiresAt: invite.expiresAt, maxUsage: invite.maxUsage, permissions: { canView: invite.canView, canFavorite: invite.canFavorite, canComment: invite.canComment, canDownload: invite.canDownload, canRequestPurchase: invite.canRequestPurchase }, status: invite.status, inviteUrl: `${baseUrl}/invite?code=${invite.inviteCode}` }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/photographer/galleries/[id]/invites - Get all invites for a gallery
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const sessionPayload = await getUserFromRequestAsync(request)

    if (!sessionPayload?.photographerId) {
      return NextResponse.json({ error: 'Unauthorized - Photographer access required' }, { status: 401 })
    }

    const galleryId = id

    // Verify the gallery belongs to the photographer
    try {
      const gallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: galleryId, photographerId: sessionPayload.photographerId } }))
      if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    } catch (dbErr) {
      console.error('DB error verifying gallery in GET /api/photographer/galleries/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Get all invites for this gallery
    let invites
    try {
      invites = await withPrismaRetry(() => prisma.invite.findMany({ where: { galleryId }, include: { clientInvites: { include: { client: { include: { user: { select: { email: true, name: true } } } } } } }, orderBy: { createdAt: 'desc' } }))
    } catch (dbErr) {
      console.error('DB error fetching invites in GET /api/photographer/galleries/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.APP_URL || 'http://localhost:3000'

    return NextResponse.json(invites.map(invite => ({ id: invite.id, code: invite.inviteCode, clientEmail: invite.clientEmail, clientName: invite.clientInvites[0]?.client?.user?.name || 'Unknown', type: invite.type, expiresAt: invite.expiresAt, maxUsage: invite.maxUsage, currentUsage: invite.usageCount, permissions: { canView: invite.canView, canFavorite: invite.canFavorite, canComment: invite.canComment, canDownload: invite.canDownload, canRequestPurchase: invite.canRequestPurchase }, status: invite.status, createdAt: invite.createdAt, inviteUrl: `${baseUrl}/invite?code=${invite.inviteCode}` })))
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}