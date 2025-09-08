import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, withPrismaRetry } from '@/lib/prisma';

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

    // Find the invite by code or email
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.findFirst({ where: inviteCode ? { inviteCode } : { clientEmail: email } }))
    } catch (dbErr) {
      console.error('DB error finding invite in POST /api/invite/validate:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Get gallery details
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findUnique({ where: { id: invite.galleryId }, include: { photographer: { select: { id: true, name: true, businessName: true, user: { select: { email: true } } } }, photos: { select: { id: true, filename: true, url: true, thumbnailUrl: true, title: true, description: true, tags: true, price: true, isForSale: true, isPrivate: true, createdAt: true } } } }))
    } catch (dbErr) {
      console.error('DB error fetching gallery in POST /api/invite/validate:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Check invite status
    if (invite.status !== 'active') {
      return NextResponse.json(
        { error: 'Invite is not active' },
        { status: 403 }
      );
    }

    // Check expiration
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 403 }
      );
    }

    // Check usage limits
    if (invite.maxUsage && invite.usageCount >= invite.maxUsage) {
      return NextResponse.json(
        { error: 'Invite usage limit exceeded' },
        { status: 403 }
      );
    }

    // Check email restriction for single-use invites
    if (invite.type === 'single_use' && invite.clientEmail) {
      // For single-use invites with email restriction, we'd need to verify the user's email
      // This would typically be done through authentication or email verification
      // For now, we'll allow access but this should be implemented based on your auth system
    }

    // Increment usage count
    try {
      await withPrismaRetry(() => prisma.invite.update({ where: { id: invite.id }, data: { usageCount: invite.usageCount + 1, usedAt: new Date() } }))
    } catch (dbErr) {
      console.error('DB error incrementing invite usage in POST /api/invite/validate:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    // Return gallery data with invite permissions
    // If accessed via email, indicate client dashboard redirect
    const response = {
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        photographer: gallery.photographer,
        photos: gallery.photos,
        createdAt: gallery.createdAt,
      },
      permissions: {
        canView: invite.canView,
        canFavorite: invite.canFavorite,
        canComment: invite.canComment,
        canDownload: invite.canDownload,
        canRequestPurchase: invite.canRequestPurchase,
      },
      invite: {
        id: invite.id,
        code: invite.inviteCode,
        type: invite.type,
        expiresAt: invite.expiresAt,
        usageCount: invite.usageCount + 1,
        maxUsage: invite.maxUsage,
      },
      // Add flag to indicate if this was accessed via email
      accessMethod: email ? 'email' : 'code',
      clientEmail: email || invite.clientEmail,
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