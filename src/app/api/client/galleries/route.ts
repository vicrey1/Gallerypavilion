import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getClientGalleriesSchema = z.object({
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const { email: validatedEmail } = getClientGalleriesSchema.parse({ email });

    // Find all invites for this email address
    const invites = await prisma.invite.findMany({
      where: {
        clientEmail: validatedEmail,
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        gallery: {
          include: {
            photographer: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            photos: {
              select: {
                id: true,
                title: true,
                description: true,
                url: true,
                thumbnailUrl: true,
                createdAt: true,
                price: true,
                isForSale: true,
                tags: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            _count: {
              select: {
                photos: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the client dashboard interface
    const galleries = invites.map((invite) => ({
      gallery: {
        id: invite.gallery.id,
        title: invite.gallery.title,
        description: invite.gallery.description,
        photographer: {
          id: invite.gallery.photographer.id,
          name: invite.gallery.photographer.name,
          businessName: invite.gallery.photographer.businessName,
          user: {
            email: invite.gallery.photographer.user.email,
          },
        },
        photos: invite.gallery.photos,
        createdAt: invite.gallery.createdAt,
        totalPhotos: invite.gallery._count.photos,
        views: invite.gallery.views,
        favorites: 0, // We'll need to calculate this based on favorites table if needed
      },
      inviteCode: invite.inviteCode,
      permissions: {
        canView: invite.canView,
        canFavorite: invite.canFavorite,
        canComment: invite.canComment,
        canDownload: invite.canDownload,
        canRequestPurchase: invite.canRequestPurchase,
      },
      accessedAt: invite.usedAt?.toISOString() || invite.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      galleries,
      total: galleries.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching client galleries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}