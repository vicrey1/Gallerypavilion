export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrismaRetry } from '@/lib/prisma';
import { getUserFromRequestAsync } from '@/lib/jwt'
import { sendInviteEmail } from '@/lib/email';

// Resend invite email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const payload = await getUserFromRequestAsync(request)
  if (!payload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the invite with gallery and photographer details
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.findFirst({ where: { id: id, gallery: { photographer: { user: { email: payload.email } } } }, include: { gallery: { include: { photographer: { include: { user: true } } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invite in POST /api/invite/[id]/resend:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    if (invite.status === 'revoked') {
      return NextResponse.json(
        { error: 'Cannot resend a revoked invite' },
        { status: 400 }
      );
    }

    if (invite.status === 'expired') {
      return NextResponse.json(
        { error: 'Cannot resend an expired invite' },
        { status: 400 }
      );
    }

    // Construct the invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.APP_URL || 'https://gallerypavilion.com';
  const inviteUrl = `${baseUrl}/client/${invite.inviteCode}`;

    // Send the email
    try {
      if (!invite.clientEmail) {
        return NextResponse.json(
          { error: 'Client email is required' },
          { status: 400 }
        );
      }

      await sendInviteEmail({
        recipientEmail: invite.clientEmail,
        galleryTitle: invite.gallery.title,
        photographerName: invite.gallery.photographer.user.name || 'Photographer',
        inviteUrl,
        expiresAt: invite.expiresAt || undefined,
        permissions: {
          canView: invite.canView,
          canFavorite: invite.canFavorite,
          canComment: invite.canComment,
          canDownload: invite.canDownload,
          canRequestPurchase: invite.canRequestPurchase,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Invite email resent successfully',
      });
    } catch (emailError) {
      console.error('Failed to resend invite email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please check your email configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}