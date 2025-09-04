import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendInviteEmail } from '@/lib/email';

const updateInviteSchema = z.object({
  clientEmail: z.string().email().optional(),
  type: z.enum(['single_use', 'multi_use', 'time_limited']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  canView: z.boolean().optional(),
  canFavorite: z.boolean().optional(),
  canComment: z.boolean().optional(),
  canDownload: z.boolean().optional(),
  canRequestPurchase: z.boolean().optional(),
  status: z.enum(['pending', 'active', 'expired', 'revoked']).optional(),
});

// Get specific invite
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invite = await prisma.invite.findFirst({
      where: {
        id: id,
        gallery: {
          photographer: {
            user: {
              email: session.user.email,
            },
          },
        },
      },
      include: {
        gallery: {
          include: {
            photographer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: invite.id,
      inviteCode: invite.inviteCode,
      galleryId: invite.galleryId,
      galleryTitle: invite.gallery.title,
      clientEmail: invite.clientEmail,
      type: invite.type,
      status: invite.status,
      expiresAt: invite.expiresAt,
      maxUsage: invite.maxUsage,
      usageCount: invite.usageCount,
      createdAt: invite.createdAt,
      permissions: {
        canView: invite.canView,
        canFavorite: invite.canFavorite,
        canComment: invite.canComment,
        canDownload: invite.canDownload,
        canRequestPurchase: invite.canRequestPurchase,
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update invite
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateInviteSchema.parse(body);

    // Verify the user owns the gallery
    const existingInvite = await prisma.invite.findFirst({
      where: {
        id: id,
        gallery: {
          photographer: {
            user: {
              email: session.user.email,
            },
          },
        },
      },
      include: {
        gallery: {
          include: {
            photographer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!existingInvite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the invite
    const updatedInvite = await prisma.invite.update({
      where: { id: id },
      data: {
        clientEmail: data.clientEmail,
        type: data.type,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxUsage: data.maxUsage,
        canView: data.canView,
        canFavorite: data.canFavorite,
        canComment: data.canComment,
        canDownload: data.canDownload,
        canRequestPurchase: data.canRequestPurchase,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: updatedInvite.id,
        inviteCode: updatedInvite.inviteCode,
        galleryId: updatedInvite.galleryId,
        galleryTitle: existingInvite.gallery.title,
        clientEmail: updatedInvite.clientEmail,
        type: updatedInvite.type,
        status: updatedInvite.status,
        expiresAt: updatedInvite.expiresAt,
        maxUsage: updatedInvite.maxUsage,
        usageCount: updatedInvite.usageCount,
        createdAt: updatedInvite.createdAt,
        permissions: {
          canView: updatedInvite.canView,
          canFavorite: updatedInvite.canFavorite,
          canComment: updatedInvite.canComment,
          canDownload: updatedInvite.canDownload,
          canRequestPurchase: updatedInvite.canRequestPurchase,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user owns the gallery
    const invite = await prisma.invite.findFirst({
      where: {
        id: id,
        gallery: {
          photographer: {
            user: {
              email: session.user.email,
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the invite
    await prisma.invite.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Invite deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}