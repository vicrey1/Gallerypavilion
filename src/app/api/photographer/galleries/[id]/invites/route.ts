import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/jwt'
import { z } from 'zod'
import { createNotification, NotificationTemplates } from '@/lib/notifications'

const inviteSchema = z.object({
  type: z.enum(['single_use', 'multi_use']),
  expiresAt: z.string().optional(),
  permissions: z.object({
    canView: z.boolean().default(true),
    canFavorite: z.boolean().default(false),
    canComment: z.boolean().default(false),
    canDownload: z.boolean().default(false),
    canRequestPurchase: z.boolean().default(false)
  })
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = getUserFromRequest(request)

    if (!payload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = inviteSchema.parse(body)
    const galleryId = id

    // Verify the gallery belongs to the photographer
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        photographerId: payload.photographerId,
      },
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Create the invite
    const invite = await prisma.invite.create({
      data: {
        inviteCode,
        galleryId,
        type: validatedData.type,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        maxUsage: validatedData.type === 'single_use' ? 1 : null,
        usageCount: 0,
        canView: validatedData.permissions.canView,
        canFavorite: validatedData.permissions.canFavorite,
        canComment: validatedData.permissions.canComment,
        canDownload: validatedData.permissions.canDownload,
        canRequestPurchase: validatedData.permissions.canRequestPurchase,
        status: 'active',
      },
    })

    // TODO: Send email notification to the client with the invite link
    // For now, we'll just return the invite details
    
    // Notify photographer that invitation was created
    try {
  const photographerUserId = payload.userId;
      const notificationTemplate = NotificationTemplates.inviteSent('Generated invite code', gallery.title);
      
      await createNotification({
        ...notificationTemplate,
        userId: photographerUserId,
        message: `Gallery invitation created for "${gallery.title}"`,
        data: {
          inviteId: invite.id,
          galleryId: gallery.id,
          inviteCode: invite.inviteCode
        }
      });
    } catch (notificationError) {
      console.warn('Failed to create photographer notification:', notificationError);
    }
    
    return NextResponse.json({
      id: invite.id,
      code: invite.inviteCode,
      type: invite.type,
      expiresAt: invite.expiresAt,
      maxUsage: invite.maxUsage,
      permissions: {
        canView: invite.canView,
        canFavorite: invite.canFavorite,
        canComment: invite.canComment,
        canDownload: invite.canDownload,
        canRequestPurchase: invite.canRequestPurchase,
      },
      status: invite.status,
      inviteUrl: `${process.env.NEXTAUTH_URL}/invite?code=${invite.inviteCode}`,
  }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/photographer/galleries/[id]/invites - Get all invites for a gallery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionPayload = getUserFromRequest(request)

    if (!sessionPayload?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const galleryId = id

    // Verify the gallery belongs to the photographer
    const gallery = await prisma.gallery.findFirst({
      where: {
  id: galleryId,
  photographerId: sessionPayload.photographerId,
      },
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Get all invites for this gallery
    const invites = await prisma.invite.findMany({
      where: { galleryId },
      include: {
        clientInvites: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      invites.map(invite => ({
        id: invite.id,
        code: invite.inviteCode,
        clientEmail: invite.clientEmail,
        clientName: invite.clientInvites[0]?.client?.user?.name || 'Unknown',
        type: invite.type,
        expiresAt: invite.expiresAt,
        maxUsage: invite.maxUsage,
        currentUsage: invite.usageCount,
        permissions: {
          canView: invite.canView,
          canFavorite: invite.canFavorite,
          canComment: invite.canComment,
          canDownload: invite.canDownload,
          canRequestPurchase: invite.canRequestPurchase,
        },
        status: invite.status,
        createdAt: invite.createdAt,
        inviteUrl: `${process.env.NEXTAUTH_URL}/invite?code=${invite.inviteCode}`,
      }))
    )

  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}