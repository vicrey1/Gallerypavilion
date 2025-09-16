const mongoose = require('mongoose');
const ShareLink = require('./models/ShareLink');
const Invitation = require('./models/Invitation');
const Gallery = require('./models/Gallery');
const User = require('./models/User');
require('dotenv').config();

async function testInvitation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'PHOTOGRAPHER'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Find or create a test gallery
    let testGallery = await Gallery.findOne({ photographer: testUser._id });
    if (!testGallery) {
      testGallery = new Gallery({
        title: 'Test Gallery',
        description: 'A test gallery for invitation testing',
        category: 'Portrait',
        photographer: testUser._id,
        settings: {
          inviteOnly: true
        }
      });
      await testGallery.save();
      console.log('✅ Created test gallery');
    }

    // Test ShareLink creation
    console.log('\n🔗 Testing ShareLink creation...');
    const shareLinkData = {
      gallery: testGallery._id,
      photographer: testUser._id,
      name: 'Test Invitation Link',
      description: 'Test invitation for debugging'
    };

    const shareLink = new ShareLink(shareLinkData);
    console.log('ShareLink before save - token:', shareLink.token);
    
    // Ensure token is generated
    if (!shareLink.token) {
      shareLink.token = await ShareLink.generateUniqueToken();
      console.log('Generated token manually:', shareLink.token);
    }
    
    await shareLink.save();
    console.log('ShareLink after save - token:', shareLink.token);
    console.log('ShareLink fullUrl:', shareLink.fullUrl);

    // Test Invitation creation
    console.log('\n📧 Testing Invitation creation...');
    const invitationData = {
      gallery: testGallery._id,
      photographer: testUser._id,
      invitedBy: testUser._id,
      recipientEmail: 'vameh09@gmail.com',
      recipientName: 'Test Recipient',
      code: shareLink.token
    };

    console.log('Invitation data:', invitationData);
    const invitation = new Invitation(invitationData);
    await invitation.save();
    console.log('✅ Invitation created successfully!');
    console.log('Invitation ID:', invitation._id);
    console.log('Invitation code:', invitation.code);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testInvitation();