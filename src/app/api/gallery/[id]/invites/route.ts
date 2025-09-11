import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InviteStatus } from '@prisma/client';

// Get all invites for a gallery
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

    // Verify the user owns the gallery
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: id,
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

    // Build where clause for filtering
  const whereClause: { galleryId: string; status?: InviteStatus } = { galleryId: id };

    if (status && status !== 'all') {
      whereClause.status = status as InviteStatus;
    }

  // Note: Invite model does not currently include a `type` field in schema.

    const invites = await prisma.invite.findMany({
      where: whereClause,
      include: {
        gallery: { select: { title: true } },
        _count: { select: { clientInvites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedInvites = invites.map(invite => ({
      id: invite.id,
      inviteCode: invite.inviteCode,
      galleryId: invite.galleryId,
      galleryTitle: invite.gallery.title,
      clientEmail: invite.clientEmail,
      status: invite.status,
      createdAt: invite.createdAt,
      usageCount: invite._count?.clientInvites ?? 0,
      permissions: {
        canView: invite.canView,
        canRequestPurchase: invite.canRequestPurchase,
      },
    }));

    return NextResponse.json({
      invites: formattedInvites,
      total: formattedInvites.length,
    });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}