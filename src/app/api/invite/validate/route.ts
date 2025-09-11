import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const validateInviteSchema = z.object({
  inviteCode: z.string().optional(),
  email: z.string().email().optional(),
}).refine(
  (data) => data.inviteCode || data.email,
  {
    message: 'Either invite code or email is required',
  }
);

export async function POST(request: NextRequest) {
  console.log('POST /api/invite/validate - Route hit!');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { inviteCode, email } = validateInviteSchema.parse(body);
    console.log('Parsed invite code:', inviteCode, 'email:', email);

    let foundInvite;

    if (email) {
      // First try to find an active invite directly by clientEmail
      foundInvite = await prisma.invite.findFirst({
        where: {
          clientEmail: email,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!foundInvite) {
        // If no direct invite found, check for registered client
        const client = await prisma.client.findFirst({
          where: { email },
          include: {
            clientInvites: {
              include: {
                invite: true
              }
            }
          }
        });

        if (!client || client.clientInvites.length === 0) {
          console.log('No invites found for email:', email);
          return NextResponse.json(
            { error: 'No galleries found for this email address' },
            { status: 404 }
          );
        }

        // Use the most recent invite
        foundInvite = client.clientInvites[0].invite;
      }
    } else {
      // Find by invite code
      foundInvite = await prisma.invite.findFirst({
        where: { inviteCode }
      });

      if (!foundInvite) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 404 }
        );
      }
    }

    // Get gallery details
    const gallery = await prisma.gallery.findUnique({
      where: { id: foundInvite.galleryId },
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            businessName: true,
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
            filename: true,
            url: true,
            thumbnailUrl: true,
            title: true,
            description: true,
            tags: true,
            price: true,
            isForSale: true,
            isPrivate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Return all the data
    const response = {
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        photographer: gallery.photographer,
        photos: gallery.photos.map((photo: any) => ({
          ...photo,
          tags: photo.tags ? JSON.parse(photo.tags as string) : [],
          isForSale: photo.isForSale || false,
        })),
        createdAt: gallery.createdAt,
      },
      permissions: {
        canView: true,
        canRequestPurchase: true,
        canFavorite: false,
        canComment: false,
        canDownload: false,
      },
      invite: {
        id: foundInvite.id,
        inviteCode: foundInvite.inviteCode,
      },
      accessMethod: email ? 'email' : 'code',
      clientEmail: email || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error validating invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
