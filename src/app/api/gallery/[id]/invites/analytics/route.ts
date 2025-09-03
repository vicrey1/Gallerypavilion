import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get invite analytics for a gallery
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
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
      where: {
        galleryId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get invites created in the specified period
    const recentInvites = await prisma.invite.findMany({
      where: {
        galleryId: params.id,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Calculate analytics
    const totalInvites = allInvites.length;
    const activeInvites = allInvites.filter(invite => invite.status === 'active').length;
    const expiredInvites = allInvites.filter(invite => invite.status === 'expired').length;
    const revokedInvites = allInvites.filter(invite => invite.status === 'revoked').length;
    const pendingInvites = allInvites.filter(invite => invite.status === 'pending').length;

    // Usage statistics
    const totalUsage = allInvites.reduce((sum, invite) => sum + invite.usageCount, 0);
    const averageUsage = totalInvites > 0 ? totalUsage / totalInvites : 0;

    // Invite types breakdown
    const singleUseInvites = allInvites.filter(invite => invite.type === 'single_use').length;
    const multiUseInvites = allInvites.filter(invite => invite.type === 'multi_use').length;
    const timeLimitedInvites = allInvites.filter(invite => invite.type === 'time_limited').length;

    // Recent activity (invites created in period)
    const recentInvitesCount = recentInvites.length;
    const recentUsage = recentInvites.reduce((sum, invite) => sum + invite.usageCount, 0);

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
      
      const dayUsage = dayInvites.reduce((sum, invite) => sum + invite.usageCount, 0);
      
      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        invitesCreated: dayInvites.length,
        totalUsage: dayUsage,
      });
    }

    // Top performing invites (by usage)
    const topInvites = allInvites
      .filter(invite => invite.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(invite => ({
        id: invite.id,
        clientEmail: invite.clientEmail,
        type: invite.type,
        usageCount: invite.usageCount,
        maxUsage: invite.maxUsage,
        createdAt: invite.createdAt,
        status: invite.status,
      }));

    // Permission usage statistics
    const permissionStats = {
      canView: allInvites.filter(invite => invite.canView).length,
      canFavorite: allInvites.filter(invite => invite.canFavorite).length,
      canComment: allInvites.filter(invite => invite.canComment).length,
      canDownload: allInvites.filter(invite => invite.canDownload).length,
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