const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Gallery = require('./models/Gallery');
    const User = require('./models/User');
    const ShareLink = require('./models/ShareLink');
    
    console.log('=== DATABASE STATUS ===');
    
    const galleries = await Gallery.find().populate('photographer', 'name email');
    console.log(`\nGalleries (${galleries.length}):`);
    galleries.forEach(g => {
      console.log(`- ${g.name} (ID: ${g._id})`);
      console.log(`  By: ${g.photographer?.name || 'Unknown'} (${g.photographer?.email || 'No email'})`);
      console.log(`  Photos: ${g.photos?.length || 0}`);
      console.log(`  Status: ${g.isPublic ? 'Public' : 'Private'}`);
    });
    
    const users = await User.find();
    console.log(`\nUsers (${users.length}):`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
    });
    
    const shareLinks = await ShareLink.find().populate('galleryId', 'name');
    console.log(`\nShare Links (${shareLinks.length}):`);
    shareLinks.forEach(s => {
      console.log(`- Token: ${s.token}`);
      console.log(`  Gallery: ${s.galleryId?.name || 'Unknown'}`);
      console.log(`  Active: ${s.isActive}`);
      console.log(`  URL: http://localhost:3001/gallery/${s.token}`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });