export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrismaRetry } from '@/lib/prisma';
import { getUserFromRequestAsync } from '@/lib/jwt'

// Revoke invite
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

    // Verify the user owns the gallery
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.findFirst({ where: { id: id, gallery: { photographer: { user: { email: payload.email } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invite in POST /api/invite/[id]/revoke:', dbErr)
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
        { error: 'Invite is already revoked' },
        { status: 400 }
      );
    }

    // Update invite status to revoked
    let revokedInvite
    try {
      revokedInvite = await withPrismaRetry(() => prisma.invite.update({ where: { id: id }, data: { status: 'revoked' } }))
    } catch (dbErr) {
      console.error('DB error updating invite in POST /api/invite/[id]/revoke:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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