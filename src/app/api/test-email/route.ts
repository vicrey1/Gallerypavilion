import { NextRequest, NextResponse } from 'next/server'
import { sendInviteEmail, testEmailConfig } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Test email configuration first
    const configTest = await testEmailConfig()
    if (!configTest.success) {
      return NextResponse.json({ 
        error: 'Email configuration is invalid or missing',
        details: configTest.error || 'Please check SMTP environment variables'
      }, { status: 500 })
    }

    // Send test invite email
    const testData = {
      recipientEmail: email,
      recipientName: 'Test User',
      galleryTitle: 'Test Gallery',
      photographerName: 'Test Photographer',
      inviteUrl: 'https://gallerypavilion.com/gallery/test/invite?code=test123',
      permissions: {
        canView: true,
        canFavorite: true,
        canComment: false,
        canDownload: false,
        canRequestPurchase: false
      }
    }

    const emailSent = await sendInviteEmail(testData)
    
    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully',
        recipient: email
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: 'Check server logs for more information'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}