import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            status: true,
            businessName: true,
            website: true,
            bio: true,
            createdAt: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            invitedBy: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        found: false,
        message: `No user found with email: ${email}`
      });
    }
    
    // Check password hash (first 20 characters for security)
    const passwordPreview = user.password ? user.password.substring(0, 20) + '...' : 'No password set';
    
    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordPreview,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        photographer: user.photographer ? {
          id: user.photographer.id,
          name: user.photographer.name,
          status: user.photographer.status,
          businessName: user.photographer.businessName,
          website: user.photographer.website,
          bio: user.photographer.bio,
          createdAt: user.photographer.createdAt,
          // Note: galleries relation would need separate query
        } : null,
        client: user.client ? {
          id: user.client.id,
          name: user.client.name,
          createdAt: user.client.createdAt,
          invitedBy: user.client.invitedBy
          // Note: invites relation would need separate query
        } : null
      }
    });
    
  } catch (error) {
    console.error('Debug user API error:', error);
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