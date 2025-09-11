import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sendInviteEmail } from '@/lib/email';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

const createInviteSchema = z.object({
  galleryId: z.string(),
  clientEmail: z.string().email(),
  canView: z.boolean().default(true),
  canRequestPurchase: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createInviteSchema.parse(body);

    // Verify the user owns the gallery
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: data.galleryId,
        photographer: {
          user: {
            email: session.user.email,
          },
        },
      },
      include: {
        photographer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

  // Generate unique invite code and normalize to lowercase for consistent matching
  const inviteCodeRaw = nanoid(12);
  const inviteCode = inviteCodeRaw.toLowerCase();

    // Create the invite
    const invite = await prisma.invite.create({
      data: {
        inviteCode,
        galleryId: data.galleryId,
        clientEmail: data.clientEmail,
        canView: data.canView,
        canRequestPurchase: data.canRequestPurchase,
      },
    });

    // Send invitation email using the proper template
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${inviteCode}`;
    
    const emailSent = await sendInviteEmail({
      recipientEmail: data.clientEmail,
      galleryTitle: gallery.title,
      photographerName: gallery.photographer.name || gallery.photographer.businessName || 'Photographer',
      inviteUrl,
      inviteCode,
      permissions: {
        canView: true,
        canRequestPurchase: true,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        photographer: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all invites for the gallery
    const invites = await prisma.invite.findMany({
      where: {
        galleryId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

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