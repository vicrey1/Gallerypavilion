import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get invite analytics for a gallery
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Verify the user owns the gallery
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: id,
        photographer: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or unauthorized' },
        { status: 404 }
      );
    }

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all invites for the gallery
    const allInvites = await prisma.invite.findMany({
      where: { galleryId: id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { clientInvites: true } } },
    });

    // Get invites created in the specified period
    const recentInvites = await prisma.invite.findMany({
      where: { galleryId: id, createdAt: { gte: startDate } },
      include: { _count: { select: { clientInvites: true } } },
    });

    // Calculate analytics
    const totalInvites = allInvites.length;
    const activeInvites = allInvites.filter(invite => invite.status === 'active').length;
    const expiredInvites = allInvites.filter(invite => invite.status === 'expired').length;
    const revokedInvites = allInvites.filter(invite => invite.status === 'revoked').length;
    const pendingInvites = allInvites.filter(invite => invite.status === 'pending').length;

  // Usage statistics (count clientInvites per invite)
  const totalUsage = allInvites.reduce((sum, invite) => sum + (invite._count?.clientInvites ?? 0), 0);
  const averageUsage = totalInvites > 0 ? totalUsage / totalInvites : 0;

  // Invite types breakdown: not available on current schema -> return zeros
  const singleUseInvites = 0;
  const multiUseInvites = 0;
  const timeLimitedInvites = 0;

    // Recent activity (invites created in period)
    const recentInvitesCount = recentInvites.length;
  const recentUsage = recentInvites.reduce((sum, invite) => sum + (invite._count?.clientInvites ?? 0), 0);

    // Daily breakdown for the period
    const dailyBreakdown = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayInvites = recentInvites.filter(invite => {
        const inviteDate = new Date(invite.createdAt);
        return inviteDate >= date && inviteDate < nextDate;
      });
      
  const dayUsage = dayInvites.reduce((sum, invite) => sum + (invite._count?.clientInvites ?? 0), 0);
      
      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        invitesCreated: dayInvites.length,
        totalUsage: dayUsage,
      });
    }

    // Top performing invites (by usage)
    const topInvites = allInvites
      .filter(invite => (invite._count?.clientInvites ?? 0) > 0)
      .sort((a, b) => (b._count?.clientInvites ?? 0) - (a._count?.clientInvites ?? 0))
      .slice(0, 5)
      .map(invite => ({
        id: invite.id,
        clientEmail: invite.clientEmail,
        usageCount: invite._count?.clientInvites ?? 0,
        createdAt: invite.createdAt,
        status: invite.status,
        inviteCode: invite.inviteCode,
      }));

    // Permission usage statistics
    const permissionStats = {
      canView: allInvites.filter(invite => invite.canView).length,
      canRequestPurchase: allInvites.filter(invite => invite.canRequestPurchase).length,
    };

    return NextResponse.json({
      summary: {
        totalInvites,
        activeInvites,
        expiredInvites,
        revokedInvites,
        pendingInvites,
        totalUsage,
        averageUsage: Math.round(averageUsage * 100) / 100,
      },
      typeBreakdown: {
        singleUse: singleUseInvites,
        multiUse: multiUseInvites,
        timeLimited: timeLimitedInvites,
      },
      recentActivity: {
        period: periodDays,
        invitesCreated: recentInvitesCount,
        totalUsage: recentUsage,
      },
      dailyBreakdown,
      topInvites,
      permissionStats,
      period: periodDays,
    });
  } catch (error) {
    console.error('Error fetching invite analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}