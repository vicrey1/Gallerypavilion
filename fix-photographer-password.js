const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Fix photographer password in production
async function fixPhotographerPassword() {
  console.log('🔧 Fixing photographer password...');
  console.log('=' .repeat(50));
  
  const prisma = new PrismaClient();
  
  try {
    // Check current state
    const photographer = await prisma.user.findUnique({
      where: { email: 'vameh09@gmail.com' },
      include: { photographer: true }
    });
    
    if (!photographer) {
      console.log('❌ Photographer not found');
      return;
    }
    
    console.log('📊 Current photographer state:');
    console.log(`   Email: ${photographer.email}`);
    console.log(`   Role: ${photographer.role}`);
    console.log(`   Has password: ${photographer.password ? 'Yes' : 'No'}`);
    console.log(`   Status: ${photographer.photographer?.status || 'N/A'}`);
    
    if (!photographer.password) {
      console.log('\n🔐 Setting default password...');
      
      // Hash a default password
      const defaultPassword = 'TempPassword123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      // Update the user with the hashed password
      await prisma.user.update({
        where: { email: 'vameh09@gmail.com' },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password set successfully!');
      console.log(`   Default password: ${defaultPassword}`);
      console.log('   ⚠️  Please ask the photographer to change this password after login');
      
      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'vameh09@gmail.com' },
        select: { email: true, password: true }
      });
      
      console.log('\n✅ Verification:');
      console.log(`   Password hash length: ${updatedUser.password.length}`);
      console.log(`   Password hash starts with: ${updatedUser.password.substring(0, 10)}...`);
      
      // Test password verification
      const isValid = await bcrypt.compare(defaultPassword, updatedUser.password);
      console.log(`   Password verification test: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
      
    } else {
      console.log('\n✅ Photographer already has a password');
      
      // Test if the current password works with common passwords
      const commonPasswords = ['password', 'password123', '123456', 'admin'];
      
      console.log('\n🔍 Testing common passwords...');
      for (const testPassword of commonPasswords) {
        const isValid = await bcrypt.compare(testPassword, photographer.password);
        if (isValid) {
          console.log(`   ✅ Current password is: ${testPassword}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing photographer password:', error.message);
    
    if (error.message.includes('Environment variable not found')) {
      console.log('\n💡 Database connection issue:');
      console.log('   - Make sure DATABASE_URL is set in your environment');
      console.log('   - For production, this should be run on Vercel or with production DB access');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative: Create an API endpoint to fix this
async function createPasswordResetEndpoint() {
  console.log('\n🔧 Creating password reset API endpoint...');
  
  const endpointCode = `
// Add this to src/app/api/admin/reset-photographer-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and newPassword are required' },
        { status: 400 }
      );
    }
    
    // Find the photographer
    const user = await prisma.user.findUnique({
      where: { email },
      include: { photographer: true }
    });
    
    if (!user || user.role !== 'photographer') {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      photographer: {
        email: user.email,
        name: user.photographer?.name,
        status: user.photographer?.status
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
`;
  
  console.log('📝 API Endpoint Code:');
  console.log(endpointCode);
  
  console.log('\n💡 Usage:');
  console.log('   POST /api/admin/reset-photographer-password');
  console.log('   Body: { "email": "vameh09@gmail.com", "newPassword": "NewPassword123!" }');
}

// Run the fix
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--endpoint-only')) {
    createPasswordResetEndpoint();
  } else {
    fixPhotographerPassword()
      .then(() => {
        console.log('\n🏁 Password fix complete');
        console.log('\n💡 Next steps:');
        console.log('  1. Test login with the new password');
        console.log('  2. Ask photographer to change password after first login');
        console.log('  3. Consider implementing password reset functionality');
      })
      .catch(console.error);
  }
}

module.exports = { fixPhotographerPassword, createPasswordResetEndpoint };