export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrismaRetry } from '@/lib/prisma';
import { getUserFromRequestAsync } from '@/lib/jwt'
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sendInviteEmail } from '@/lib/email';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

const createInviteSchema = z.object({
  galleryId: z.string(),
  clientEmail: z.string().email(),
  type: z.enum(['single_use', 'multi_use', 'time_limited']).default('single_use'),
  expiresAt: z.string().datetime().optional(),
  maxUsage: z.number().int().positive().optional(),
  canView: z.boolean().default(true),
  canFavorite: z.boolean().default(true),
  canComment: z.boolean().default(false),
  canDownload: z.boolean().default(false),
  canRequestPurchase: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)
  if (!payload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createInviteSchema.parse(body);

    // Verify the user owns the gallery
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: data.galleryId, photographer: { user: { email: payload.email } } }, include: { photographer: { include: { user: true } } } }))
    } catch (dbErr) {
      console.error('DB error verifying gallery in /api/invite POST:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate unique invite code
    const inviteCode = nanoid(12);

    // Create the invite
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.create({ data: { inviteCode, galleryId: data.galleryId, clientEmail: data.clientEmail, type: data.type, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, maxUsage: data.maxUsage, canView: data.canView, canFavorite: data.canFavorite, canComment: data.canComment, canDownload: data.canDownload, canRequestPurchase: data.canRequestPurchase } }))
    } catch (dbErr) {
      console.error('DB error creating invite in /api/invite POST:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Send invitation email using the proper template
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.APP_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${inviteCode}`;
    
    const emailSent = await sendInviteEmail({
      recipientEmail: data.clientEmail,
      galleryTitle: gallery.title,
      photographerName: gallery.photographer.name || gallery.photographer.businessName || 'Photographer',
      inviteUrl,
      inviteCode,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      permissions: {
        canView: data.canView,
        canFavorite: data.canFavorite,
        canComment: data.canComment,
        canDownload: data.canDownload,
        canRequestPurchase: data.canRequestPurchase,
      },
    });
    
    if (!emailSent) {
      console.warn('Failed to send invitation email, but invite was created successfully');
    }

    // Notify photographer that invitation was sent
    try {
  const photographerUserId = gallery.photographer.user.id;
      const notificationTemplate = NotificationTemplates.inviteSent(data.clientEmail, gallery.title);
      
      await createNotification({
        ...notificationTemplate,
        userId: photographerUserId,
        data: {
          inviteId: invite.id,
          galleryId: gallery.id,
          clientEmail: data.clientEmail
        }
      });
    } catch (notificationError) {
      console.warn('Failed to create photographer notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        inviteCode: invite.inviteCode,
        inviteUrl,
        clientEmail: invite.clientEmail,
        type: invite.type,
        expiresAt: invite.expiresAt,
        maxUsage: invite.maxUsage,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get invites for a gallery
export async function GET(request: NextRequest) {
  try {
  const payload = await getUserFromRequestAsync(request)
  if (!payload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get('galleryId');

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }

    // Verify the user owns the gallery
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findFirst({
        where: {
          id: galleryId,
          photographer: {
            user: {
              email: payload.email,
            },
          },
        },
      }))
    } catch (dbErr) {
      console.error('DB error verifying gallery in /api/invite GET:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all invites for the gallery
    let invites
    try {
      invites = await withPrismaRetry(() => prisma.invite.findMany({ where: { galleryId }, orderBy: { createdAt: 'desc' } }))
    } catch (dbErr) {
      console.error('DB error fetching invites in /api/invite GET:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      invites,
    });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}