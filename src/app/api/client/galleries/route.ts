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

    // Find all active invites for this email address
  const invites = await prisma.invite.findMany({
      where: {
        clientEmail: validatedEmail,
        status: 'active',
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
  // Prisma client types can be strict about included relations in some generated contexts;
  // cast to any[] for flexible mapping here.
  const invitesAny = invites as any[];

    // Transform the data to match the client dashboard interface
  const galleries = invitesAny.map((invite) => ({
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
        favorites: 0, // calculate from favorites table if needed
      },
      inviteCode: invite.inviteCode,
      permissions: {
        // Only map permissions that exist on the Invite model and derive sensible defaults
        canView: invite.canView,
        canFavorite: true,
        canComment: true,
        canDownload: Boolean(invite.gallery?.allowDownloads),
        canRequestPurchase: invite.canRequestPurchase,
      },
      // Use updatedAt/createdAt as a best-effort 'accessedAt' timestamp (usedAt isn't present on the model)
      accessedAt: (invite.updatedAt || invite.createdAt).toISOString(),
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