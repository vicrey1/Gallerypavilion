import nodemailer from 'nodemailer'

export async function createTransporter() {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    throw new Error('Email configuration not found')
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds

  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration not found. Skipping password reset email.')
    return false
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #7c3aed;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h2>Reset Your Password</h2>
      <p>You recently requested to reset your password for your Gallery Pavilion account. Click the button below to reset it.</p>
      <p><a href="${resetUrl}" class="button">Reset Your Password</a></p>
      <p>If you did not request a password reset, please ignore this email or contact us if you have concerns.</p>
      <p>This password reset link is only valid for 1 hour.</p>
      <div class="footer">
        <p>Gallery Pavilion</p>
        <p>This email was sent to ${email}.</p>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Gallery Pavilion" <${process.env.EMAIL_SERVER_USER}>`,
    to: email,
    subject: 'Reset Your Gallery Pavilion Password',
    html
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = await createTransporter()
      await transporter.verify()
      const result = await transporter.sendMail(mailOptions)
      console.log('Password reset email sent successfully:', { to: email, messageId: result.messageId })
      transporter.close()
      return true
    } catch (error) {
      console.error(`Password reset email attempt ${attempt} failed:`, error)
      if (attempt === maxRetries) {
        return false
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  return false
}

interface InviteEmailData {
  recipientEmail: string
  recipientName?: string
  galleryTitle: string
  photographerName: string
  inviteUrl: string
  inviteCode?: string
  permissions: {
    canView: boolean
    canRequestPurchase: boolean
  }
}

// Create email transporter with local testing fallback

// Generate HTML email template
function generateInviteEmailHTML(data: InviteEmailData): string {
  const permissionsList = `
    <li>View photos in the gallery</li>
    <li>Request photo purchases</li>
  `

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gallery Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .cta-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .permissions {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎨 Gallery Invitation</h1>
        <p>You've been invited to view a private photo gallery</p>
      </div>
      
      <div class="content">
        <h2>Hello${data.recipientName ? ` ${data.recipientName}` : ''}!</h2>
        
        <p><strong>${data.photographerName}</strong> has invited you to view their private gallery: <strong>"${data.galleryTitle}"</strong></p>
        
        ${data.inviteCode ? `<div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px dashed #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Your Invitation Code</h3>
          <p style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; margin: 10px 0;">${data.inviteCode}</p>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">Use this code to access the gallery at <a href="https://www.gallerypavilion.com" style="color: #667eea;">www.gallerypavilion.com</a></p>
        </div>` : ''}
        
        <div class="permissions">
          <h3>Your Access Permissions:</h3>
          <ul>
            ${permissionsList}
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.inviteUrl}" class="cta-button">View Gallery</a>
        </div>
        
        <p style="text-align: center; margin-top: 20px;">
          <small>Or visit <a href="https://www.gallerypavilion.com" style="color: #667eea;">www.gallerypavilion.com</a> and enter your invitation code</small>
        </p>
        
        <p><small>If the button doesn&apos;t work, copy and paste this link into your browser:<br>
        <a href="${data.inviteUrl}">${data.inviteUrl}</a></small></p>
      </div>
      
      <div class="footer">
        <p>This is an automated email from Gallery Pavilion. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

// Generate plain text email
function generateInviteEmailText(data: InviteEmailData): string {
  const permissions = `
- View photos in the gallery
- Request photo purchases`

  return `
Gallery Invitation

Hello${data.recipientName ? ` ${data.recipientName}` : ''}!

${data.photographerName} has invited you to view their private gallery: "${data.galleryTitle}"

${data.inviteCode ? `Your Invitation Code: ${data.inviteCode}
You can use this code at www.gallerypavilion.com

` : ''}Your Access Permissions:
${permissions}

View Gallery: ${data.inviteUrl}

Or visit www.gallerypavilion.com and enter your invitation code

This is an automated email from Gallery Pavilion. Please do not reply to this email.
  `
}

// Send invite email with retry logic
export async function sendInviteEmail(data: InviteEmailData): Promise<boolean> {
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds

  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration not found. Skipping email send.')
    return false
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Gallery Pavilion" <${process.env.EMAIL_SERVER_USER}>`,
    to: data.recipientEmail,
    subject: `Gallery Invitation: ${data.galleryTitle}`,
    text: generateInviteEmailText(data),
    html: generateInviteEmailHTML(data)
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = await createTransporter()
      await transporter.verify()
      const result = await transporter.sendMail(mailOptions)
      transporter.close()
      return true
    } catch (error) {
      if (attempt === maxRetries) {
        return false
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  return false
}


// Test email configuration
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter()
    await transporter.verify()
    console.log('Email configuration test passed')
    return { success: true }
  } catch (error) {
    console.error('Email configuration test failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}