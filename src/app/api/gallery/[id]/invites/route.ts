export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/jwt'
import { InviteType, InviteStatus } from '@prisma/client';

// Get all invites for a gallery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = getUserFromRequest(request)
    if (!payload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Verify the user owns the gallery
    let gallery
    try {
      gallery = await withPrismaRetry(() => prisma.gallery.findFirst({ where: { id: id, photographer: { user: { email: payload.email } } } }))
    } catch (dbErr) {
      console.error('DB error verifying gallery in GET /api/gallery/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    const whereClause: { galleryId: string; status?: InviteStatus; type?: InviteType } = {
      galleryId: id,
    };

    if (status && status !== 'all') {
      whereClause.status = status as InviteStatus;
    }

    if (type && type !== 'all') {
      whereClause.type = type as InviteType;
    }

    let invites
    try {
      invites = await withPrismaRetry(() => prisma.invite.findMany({ where: whereClause, include: { gallery: { select: { title: true } } }, orderBy: { createdAt: 'desc' } }))
    } catch (dbErr) {
      console.error('DB error fetching invites in GET /api/gallery/[id]/invites:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

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