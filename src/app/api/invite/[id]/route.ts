export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, withPrismaRetry } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/jwt'
import { sendInviteEmail } from '@/lib/email';

const updateInviteSchema = z.object({
  clientEmail: z.string().email().optional(),
  type: z.enum(['single_use', 'multi_use', 'time_limited']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  canView: z.boolean().optional(),
  canFavorite: z.boolean().optional(),
  canComment: z.boolean().optional(),
  canDownload: z.boolean().optional(),
  canRequestPurchase: z.boolean().optional(),
  status: z.enum(['pending', 'active', 'expired', 'revoked']).optional(),
});

// Get specific invite
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

    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.findFirst({ where: { id: id, gallery: { photographer: { user: { email: payload.email } } } }, include: { gallery: { include: { photographer: { include: { user: true } } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invite in GET /api/invite/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update invite
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
  const sessionPayload = getUserFromRequest(request)
  if (!sessionPayload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateInviteSchema.parse(body);

    // Verify the user owns the gallery
    let existingInvite
    try {
      existingInvite = await withPrismaRetry(() => prisma.invite.findFirst({ where: { id: id, gallery: { photographer: { user: { email: sessionPayload.email } } } }, include: { gallery: { include: { photographer: { include: { user: true } } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invite in PUT /api/invite/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!existingInvite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the invite
    let updatedInvite
    try {
      updatedInvite = await withPrismaRetry(() => prisma.invite.update({ where: { id: id }, data: { clientEmail: data.clientEmail, type: data.type, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, maxUsage: data.maxUsage, canView: data.canView, canFavorite: data.canFavorite, canComment: data.canComment, canDownload: data.canDownload, canRequestPurchase: data.canRequestPurchase, status: data.status } }))
    } catch (dbErr) {
      console.error('DB error updating invite in PUT /api/invite/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: updatedInvite.id,
        inviteCode: updatedInvite.inviteCode,
        galleryId: updatedInvite.galleryId,
        galleryTitle: existingInvite.gallery.title,
        clientEmail: updatedInvite.clientEmail,
        type: updatedInvite.type,
        status: updatedInvite.status,
        expiresAt: updatedInvite.expiresAt,
        maxUsage: updatedInvite.maxUsage,
        usageCount: updatedInvite.usageCount,
        createdAt: updatedInvite.createdAt,
        permissions: {
          canView: updatedInvite.canView,
          canFavorite: updatedInvite.canFavorite,
          canComment: updatedInvite.canComment,
          canDownload: updatedInvite.canDownload,
          canRequestPurchase: updatedInvite.canRequestPurchase,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
  const sessionPayload = getUserFromRequest(request)
  if (!sessionPayload?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user owns the gallery
    let invite
    try {
      invite = await withPrismaRetry(() => prisma.invite.findFirst({ where: { id: id, gallery: { photographer: { user: { email: sessionPayload.email } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invite in DELETE /api/invite/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the invite
    try {
      await withPrismaRetry(() => prisma.invite.delete({ where: { id: id } }))
    } catch (dbErr) {
      console.error('DB error deleting invite in DELETE /api/invite/[id]:', dbErr)
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invite deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}