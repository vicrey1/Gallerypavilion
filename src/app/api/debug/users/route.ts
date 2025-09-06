import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const email = searchParams.get('email');
    
    let whereClause = {};
    if (email) {
      whereClause = {
        email: {
          contains: email,
          mode: 'insensitive'
        }
      };
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            status: true,
            businessName: true,
            createdAt: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        }
      },
      take: limit,
      orderBy: {
        id: 'desc'
      }
    });
    
    const totalUsers = await prisma.user.count({ where: whereClause });
    const totalPhotographers = await prisma.photographer.count();
    const totalClients = await prisma.client.count();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalPhotographers,
        totalClients,
        showing: users.length
      },
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        photographer: user.photographer ? {
          id: user.photographer.id,
          name: user.photographer.name,
          status: user.photographer.status,
          businessName: user.photographer.businessName,
          createdAt: user.photographer.createdAt
        } : null,
        client: user.client ? {
          id: user.client.id,
          name: user.client.name,
          createdAt: user.client.createdAt
        } : null
      }))
    });
    
  } catch (error) {
    console.error('Debug users API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}