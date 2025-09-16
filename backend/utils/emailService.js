const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    const emailConfig = {
      host: process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || 587,
      secure: process.env.EMAIL_SERVER_SECURE === 'true' || process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_SERVER_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASS
      }
    };

    // For development, use ethereal email if no SMTP config
    if (!process.env.EMAIL_SERVER_USER && !process.env.SMTP_USER && process.env.NODE_ENV === 'development') {
      console.log('⚠️  No SMTP configuration found. Using test account for development.');
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service connection failed:', error.message);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('📧 Test email account created:');
      console.log('   User:', testAccount.user);
      console.log('   Pass:', testAccount.pass);
      console.log('   Preview URLs will be logged after sending emails');
    } catch (error) {
      console.error('Failed to create test account:', error);
    }
  }

  generateInvitationEmailHTML(invitation, gallery, photographer) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/gallery/invite/${invitation.code}`;
    const galleryUrl = `${frontendUrl}/gallery/${gallery._id}`;
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gallery Invitation</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
            }
            .content {
                margin: 30px 0;
            }
            .gallery-info {
                background: #f8fafc;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .gallery-title {
                font-size: 20px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 8px;
            }
            .gallery-description {
                color: #4b5563;
                margin-bottom: 12px;
            }
            .photographer-info {
                color: #6b7280;
                font-size: 14px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
            }
            .invitation-details {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
            }
            .invitation-code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #92400e;
                background: white;
                padding: 8px 12px;
                border-radius: 4px;
                display: inline-block;
                margin: 8px 0;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .expiry-info {
                background: #fef2f2;
                border: 1px solid #fca5a5;
                border-radius: 6px;
                padding: 12px;
                margin: 16px 0;
                color: #991b1b;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
                .cta-button {
                    display: block;
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📸 Gallery Pavilion</div>
                <h1 class="title">You're Invited!</h1>
                <p class="subtitle">Access to an exclusive photography gallery</p>
            </div>
            
            <div class="content">
                <p>Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},</p>
                
                <p><strong>${photographer.name}</strong> has invited you to view their exclusive photography gallery. This is a private collection that requires special access.</p>
                
                <div class="gallery-info">
                    <h3>🎨 Exclusive Access</h3>
                    <p style="font-style: italic; margin: 0;">You've been granted special access to view this curated collection of professional photography. Click the button below to explore the gallery at your convenience.</p>
                </div>
                
                <div class="gallery-info">
                    <div class="gallery-title">${gallery.title}</div>
                    ${gallery.description ? `<div class="gallery-description">${gallery.description}</div>` : ''}
                    <div class="photographer-info">By ${photographer.name}</div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" class="cta-button">View Gallery</a>
                </div>
                
                <div class="invitation-details">
                    <strong>🎫 Your Invitation Code:</strong><br>
                    <span class="invitation-code">${invitation.code}</span><br>
                    <small>Use this code if the button above doesn't work</small>
                </div>
                
                ${invitation.expiresAt ? `
                <div class="expiry-info">
                    ⏰ <strong>Important:</strong> This invitation expires on ${new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })} at ${new Date(invitation.expiresAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                ` : ''}
                
                <p>Simply click the button above or visit the gallery and enter your invitation code to access the exclusive content.</p>
                
                <p>If you have any questions, feel free to reach out to ${photographer.name} directly.</p>
            </div>
            
            <div class="footer">
                <p>This invitation was sent via Gallery Pavilion</p>
                <p>If you believe you received this email in error, please ignore it.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generateInvitationEmailText(invitation, gallery, photographer) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/gallery/invite/${invitation.code}`;
    
    return `
GALLERY PAVILION - EXCLUSIVE INVITATION

Hello${invitation.recipientName ? ` ${invitation.recipientName}` : ''},

${photographer.name} has invited you to view their exclusive photography gallery: "${gallery.title}"

${gallery.description ? `Gallery Description: ${gallery.description}\n` : ''}\n🎨 You've been granted exclusive access to view this curated collection of professional photography.\n

Your Invitation Code: ${invitation.code}

Access the gallery here: ${inviteUrl}

${invitation.expiresAt ? `⚠️ This invitation expires on ${new Date(invitation.expiresAt).toLocaleDateString()} at ${new Date(invitation.expiresAt).toLocaleTimeString()}\n` : ''}
If you have any questions, please contact ${photographer.name} directly.

---
This invitation was sent via Gallery Pavilion
If you believe you received this email in error, please ignore it.
    `;
  }

  async sendInvitationEmail(invitation, gallery, photographer) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const htmlContent = this.generateInvitationEmailHTML(invitation, gallery, photographer);
    const textContent = this.generateInvitationEmailText(invitation, gallery, photographer);
    
    const mailOptions = {
      from: {
        name: 'Gallery Pavilion',
        address: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_SERVER_USER || process.env.SMTP_USER || 'noreply@gallerypavilion.com'
      },
      to: {
        name: invitation.recipientName || '',
        address: invitation.recipientEmail
      },
      subject: `🎨 Exclusive Gallery Invitation: "${gallery.title}" by ${photographer.name}`,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Gallery Pavilion v1.0'
      }
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log preview URL for development
      if (process.env.NODE_ENV === 'development' && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Email sent! Preview URL:', previewUrl);
        }
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }
    
    return this.transporter.verify();
  }
}

module.exports = new EmailService();