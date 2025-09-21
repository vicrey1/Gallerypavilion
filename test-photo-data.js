const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB and check photo data
async function checkPhotoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the Photo model
    const Photo = require('./backend/models/Photo');
    
    // Find a photo to examine
    const photo = await Photo.findOne({ isDeleted: false }).lean();
    
    if (photo) {
      console.log('\n📸 Photo Data:');
      console.log(`ID: ${photo._id}`);
      console.log(`Title: ${photo.title}`);
      console.log(`Storage Type: ${photo.storageType}`);
      console.log(`Original Key: ${photo.originalKey}`);
      console.log(`Preview Key: ${photo.previewKey}`);
      console.log(`Thumbnail Key: ${photo.thumbnailKey}`);
      
      if (photo.cloudinary) {
        console.log('\n☁️ Cloudinary Data:');
        console.log(`Public ID: ${photo.cloudinary.publicId}`);
        console.log(`Original URL: ${photo.cloudinary.originalUrl}`);
        console.log(`Preview URL: ${photo.cloudinary.previewUrl}`);
        console.log(`Thumbnail URL: ${photo.cloudinary.thumbnailUrl}`);
      } else {
        console.log('\n❌ No Cloudinary data found');
      }
      
      // Check if this is a legacy photo that needs migration
      if (!photo.storageType) {
        console.log('\n⚠️ This appears to be a legacy photo without storage type');
        console.log('It may need to be migrated to use Cloudinary');
      }
      
    } else {
      console.log('❌ No photos found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkPhotoData();