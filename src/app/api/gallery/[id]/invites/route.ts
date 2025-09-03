import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get all invites for a gallery
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Verify the user owns the gallery
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: params.id,
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
    const whereClause: any = {
      galleryId: params.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const invites = await prisma.invite.findMany({
      where: whereClause,
      include: {
        gallery: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedInvites = invites.map(invite => ({
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