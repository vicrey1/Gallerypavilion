const mongoose = require('mongoose');
require('dotenv').config();
const Gallery = require('./models/Gallery');

async function testBioUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a gallery to test with
    const gallery = await Gallery.findOne({title: 'Test Gallery'});
    if (!gallery) {
      console.log('No test gallery found');
      process.exit(1);
    }
    
    console.log('Before update - Bio:', gallery.photographerBio);
    
    // Update the biography
    const updated = await Gallery.findByIdAndUpdate(
      gallery._id, 
      { photographerBio: 'Updated test biography from direct update' }, 
      { new: true }
    );
    
    console.log('After update - Bio:', updated.photographerBio);
    
    // Verify the update persisted
    const verified = await Gallery.findById(gallery._id);
    console.log('Verified from DB - Bio:', verified.photographerBio);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBioUpdate();