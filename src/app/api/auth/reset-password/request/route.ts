import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        photographer: true
      }
    })

    // Don't reveal if user exists
    if (!user || user.role !== 'photographer') {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      })
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    // Hash token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Save reset token and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl)

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.'
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Unable to process password reset request' },
      { status: 500 }
    )
  }
}
