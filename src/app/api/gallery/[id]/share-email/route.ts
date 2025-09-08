import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/jwt'
import { z } from 'zod'
import { sendInviteEmail } from '@/lib/email'
import { createNotification, NotificationTemplates } from '@/lib/notifications'

const emailShareSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['single_use', 'multi_use']).default('single_use'),
  expiresAt: z.string().optional(),
  permissions: z.object({
    canView: z.boolean().default(true),
    canFavorite: z.boolean().default(false),
    canComment: z.boolean().default(false),
    canDownload: z.boolean().default(false),
    canRequestPurchase: z.boolean().default(false)
  }).default({
    canView: true,
    canFavorite: false,
    canComment: false,
    canDownload: false,
    canRequestPurchase: false
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
    const validatedData = emailShareSchema.parse(body)
    const galleryId = id

    // Verify the gallery belongs to the photographer
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        photographerId: payload.photographerId,
      },
      include: {
        photographer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check if an active invite already exists for this email and gallery
    const existingInvite = await prisma.invite.findFirst({
      where: {
        galleryId,
        clientEmail: validatedData.email,
        status: 'active'
      }
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An active invite already exists for this email address' },
        { status: 409 }
      )
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Create the invite with email
    const invite = await prisma.invite.create({
      data: {
        inviteCode,
        galleryId,
        clientEmail: validatedData.email,
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

    // Resolve base URL for invite links with sensible fallbacks
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'

    // Send email notification to the client
    const emailSent = await sendInviteEmail({
      recipientEmail: validatedData.email,
      recipientName: validatedData.email.split('@')[0], // Use email prefix as name
      galleryTitle: gallery.title,
      photographerName: gallery.photographer?.user?.name || gallery.photographer?.businessName || 'Photographer',
      inviteUrl: `${baseUrl}/invite?code=${invite.inviteCode}`,
      expiresAt: invite.expiresAt || undefined,
      permissions: {
        canView: invite.canView,
        canFavorite: invite.canFavorite,
        canComment: invite.canComment,
        canDownload: invite.canDownload,
        canRequestPurchase: invite.canRequestPurchase,
      }
    })
    
    // Notify photographer that invitation was sent
    try {
      const photographerUserId = gallery.photographer.user.id;
      const notificationTemplate = NotificationTemplates.inviteSent(validatedData.email, gallery.title);
      
      await createNotification({
        ...notificationTemplate,
        userId: photographerUserId,
        data: {
          inviteId: invite.id,
          galleryId: gallery.id,
          clientEmail: validatedData.email
        }
      });
    } catch (notificationError) {
      console.warn('Failed to create photographer notification:', notificationError);
    }
    
    return NextResponse.json({
      id: invite.id,
      code: invite.inviteCode,
      email: invite.clientEmail,
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
  inviteUrl: `${baseUrl}/invite?code=${invite.inviteCode}`,
      emailSent,
      message: emailSent 
        ? 'Invite created and email sent successfully!' 
        : 'Invite created successfully. Email could not be sent (check SMTP configuration).'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating email invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}