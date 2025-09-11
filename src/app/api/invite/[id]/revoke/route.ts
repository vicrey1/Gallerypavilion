import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Revoke invite
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

    if (invite.status === 'revoked') {
      return NextResponse.json(
        { error: 'Invite is already revoked' },
        { status: 400 }
      );
    }

    // Update invite status to revoked
    const revokedInvite = await prisma.invite.update({
      where: { id: id },
      data: {
        status: 'revoked',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invite revoked successfully',
      invite: {
        id: revokedInvite.id,
        status: revokedInvite.status,
      },
    });
  } catch (error) {
    console.error('Error revoking invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}