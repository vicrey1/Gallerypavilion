const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Gallery = require('./models/Gallery');
    const ShareLink = require('./models/ShareLink');
    
    // Find the first gallery
    const gallery = await Gallery.findOne();
    
    if (gallery) {
      // Create a simple share link
      const shareLink = new ShareLink({
        galleryId: gallery._id,
        token: 'demo-gallery-' + Date.now(),
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        hasPassword: false,
        isInviteOnly: false
      });
      
      await shareLink.save();
      console.log('\n=== DEMO SHARE LINK CREATED ===');
      console.log('Gallery:', gallery.name || 'Untitled Gallery');
      console.log('Share URL:', `http://localhost:3001/gallery/${shareLink.token}`);
      console.log('Token:', shareLink.token);
      console.log('Active until:', shareLink.expiresAt.toLocaleDateString());
    } else {
      console.log('No galleries found in database.');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });