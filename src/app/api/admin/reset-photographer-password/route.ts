import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, withPrismaRetry } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, adminKey } = await request.json();
    
    // Simple admin key check (you should use a proper admin authentication)
    if (adminKey !== process.env.ADMIN_RESET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and newPassword are required' },
        { status: 400 }
      );
    }
    
  // Find the photographer
  const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email }, include: { photographer: true } }))
    
    if (!user || user.role !== 'photographer') {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
  // Update the password
  await withPrismaRetry(() => prisma.user.update({ where: { email }, data: { password: hashedPassword } }))
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      photographer: {
        email: user.email,
        name: user.photographer?.name,
        status: user.photographer?.status,
        hadPasswordBefore: !!user.password
      }
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check photographer status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const adminKey = searchParams.get('adminKey');
    
    if (adminKey !== process.env.ADMIN_RESET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
  const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email }, include: { photographer: true } }))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        photographer: user.photographer ? {
          name: user.photographer.name,
          status: user.photographer.status,
          businessName: user.photographer.businessName,
          createdAt: user.photographer.createdAt
        } : null
      }
    });
    
  } catch (error) {
    console.error('Get photographer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}