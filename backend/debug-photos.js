const mongoose = require('mongoose');
require('dotenv').config();
const Gallery = require('./models/Gallery');
const Photo = require('./models/Photo');

async function debugPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gallery-pavilion');
    console.log('Connected to MongoDB');
    
    // Check active galleries
    const galleries = await Gallery.find({ isDeleted: { $ne: true } });
    console.log('\nActive galleries:', galleries.length);
    galleries.forEach(g => {
      console.log(`Gallery: ${g._id} - ${g.title} - isPublished: ${g.isPublished}`);
    });
    
    // Check all photos
    const photos = await Photo.find().populate('gallery');
    console.log('\nTotal photos:', photos.length);
    
    // Check photos with active galleries
    const activePhotos = photos.filter(p => p.gallery && !p.gallery.isDeleted && !p.isDeleted);
    console.log('Photos with active galleries:', activePhotos.length);
    
    activePhotos.forEach(p => {
      console.log(`Active photo: ${p._id} - ${p.title} - Gallery: ${p.gallery.title}`);
    });
    
    // Check deleted photos
    const deletedPhotos = photos.filter(p => p.isDeleted || (p.gallery && p.gallery.isDeleted));
    console.log('\nDeleted/orphaned photos:', deletedPhotos.length);
    
    deletedPhotos.forEach(p => {
      console.log(`Deleted photo: ${p._id} - ${p.title} - Gallery deleted: ${p.gallery?.isDeleted || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPhotos();