import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendInviteEmail } from '@/lib/email';

// Resend invite email
export async function POST(
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

    // Get the invite with gallery and photographer details
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
    const baseUrl = process.env.NEXTAUTH_URL || 'https://gallerypavilion.com';
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
        permissions: {
          canView: invite.canView,
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