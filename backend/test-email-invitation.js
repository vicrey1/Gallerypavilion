const mongoose = require('mongoose');
const ShareLink = require('./models/ShareLink');
const Invitation = require('./models/Invitation');
const Gallery = require('./models/Gallery');
const User = require('./models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a test email service for this test
class TestEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTestTransporter();
  }

  async initializeTestTransporter() {
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
    } catch (error) {
      console.error('Failed to create test account:', error);
    }
  }

  async sendInvitationEmail(invitation, gallery, photographer) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/gallery/${invitation.code}`;
    
    const mailOptions = {
      from: 'noreply@gallerypavilion.com',
      to: invitation.recipientEmail,
      subject: `🎨 Exclusive Gallery Invitation: "${gallery.title}" by ${photographer.name}`,
      html: `
        <h2>Gallery Pavilion - Exclusive Invitation</h2>
        <p>Hello ${invitation.recipientName || 'there'},</p>
        <p>${photographer.name} has invited you to view their exclusive photography gallery: "${gallery.title}"</p>
        <p><strong>Your Invitation Code:</strong> ${invitation.code}</p>
        <p><a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Gallery</a></p>
        <p>Or visit: ${inviteUrl}</p>
        <p>Best regards,<br>Gallery Pavilion Team</p>
      `,
      text: `
        Gallery Pavilion - Exclusive Invitation
        
        Hello ${invitation.recipientName || 'there'},
        
        ${photographer.name} has invited you to view their exclusive photography gallery: "${gallery.title}"
        
        Your Invitation Code: ${invitation.code}
        
        Access the gallery here: ${inviteUrl}
        
        Best regards,
        Gallery Pavilion Team
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }
}

const testEmailService = new TestEmailService();

async function testEmailInvitation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user and gallery we created
    const testUser = await User.findOne({ email: 'test@example.com' });
    const testGallery = await Gallery.findOne({ photographer: testUser._id });

    if (!testUser || !testGallery) {
      console.log('❌ Test user or gallery not found. Run test-invitation.js first.');
      return;
    }

    console.log('✅ Found test user and gallery');

    // Create ShareLink with proper token generation
    console.log('\n🔗 Creating ShareLink...');
    const shareLinkData = {
      gallery: testGallery._id,
      photographer: testUser._id,
      name: 'Email Test Invitation Link',
      description: 'Testing email invitation functionality'
    };

    const shareLink = new ShareLink(shareLinkData);
    
    // Ensure token is generated
    if (!shareLink.token) {
      shareLink.token = await ShareLink.generateUniqueToken();
    }
    
    await shareLink.save();
    await shareLink.populate('gallery photographer');
    console.log('✅ ShareLink created with token:', shareLink.token);

    // Create invitation
    console.log('\n📧 Creating invitation...');
    const invitationData = {
      gallery: testGallery._id,
      photographer: testUser._id,
      invitedBy: testUser._id,
      recipientEmail: 'vameh09@gmail.com',
      recipientName: 'Test Recipient',
      code: shareLink.token
    };

    const invitation = new Invitation(invitationData);
    await invitation.save();
    await invitation.populate('gallery photographer');
    console.log('✅ Invitation created successfully!');

    // Prepare email data
    const emailData = {
      ...invitation.toObject(),
      fullUrl: shareLink.fullUrl,
      token: shareLink.token
    };

    console.log('\n📬 Sending invitation email...');
    console.log('Email data:', {
      recipientEmail: emailData.recipientEmail,
      recipientName: emailData.recipientName,
      fullUrl: emailData.fullUrl,
      galleryTitle: emailData.gallery.title
    });

    // Wait for test email service to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send the invitation email
    try {
      const emailResult = await testEmailService.sendInvitationEmail(
        invitation,
        testGallery,
        {
          name: `${testUser.firstName} ${testUser.lastName}`,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email
        }
      );
      
      console.log('✅ Email sent successfully!');
      console.log('Email result:', emailResult);
      
      if (emailResult.previewUrl) {
        console.log('📧 Preview URL:', emailResult.previewUrl);
      }
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testEmailInvitation();