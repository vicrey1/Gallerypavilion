const mongoose = require('mongoose');
const ShareLink = require('./models/ShareLink');
const Gallery = require('./models/Gallery');

async function checkShareLink() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gallery-pavilion');
    console.log('Connected to MongoDB');
    
    const shareLink = await ShareLink.findOne({ token: 'test-buyer-link-1757948181049' }).populate('gallery');
    console.log('ShareLink found:', shareLink ? 'YES' : 'NO');
    
    if (shareLink) {
      console.log('Token:', shareLink.token);
      console.log('Gallery:', shareLink.gallery?.title || 'No gallery');
      console.log('Expires:', shareLink.expiresAt);
      console.log('Is Valid:', shareLink.isValidAccess());
    } else {
      console.log('\nAvailable tokens:');
      const allLinks = await ShareLink.find({ isDeleted: false }).select('token name gallery').populate('gallery', 'title');
      allLinks.forEach(link => {
        console.log(`- ${link.token} (${link.name}) - Gallery: ${link.gallery?.title || 'Unknown'}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkShareLink();