const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Gallery = require('./models/Gallery');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testApiSave() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a gallery and its owner
    const gallery = await Gallery.findOne({title: 'Test Gallery'}).populate('photographer');
    if (!gallery) {
      console.log('No test gallery found');
      process.exit(1);
    }
    
    console.log('Gallery ID:', gallery._id);
    console.log('Gallery owner:', gallery.photographer.email);
    console.log('Current bio:', gallery.photographerBio);
    
    // Create a JWT token for the owner (matching backend requirements)
    const token = jwt.sign(
      { userId: gallery.photographer._id },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1h',
        issuer: 'gallery-pavilion',
        audience: 'gallery-pavilion-users'
      }
    );
    
    // Prepare data like the frontend does
    const updateData = {
      title: gallery.title,
      description: gallery.description || 'Test description',
      category: gallery.category || 'Portrait',
      photographerBio: 'Test biography from API simulation - ' + new Date().toISOString(),
      collections: JSON.stringify(gallery.collections || []),
      settings: JSON.stringify({
        allowDownload: false,
        showMetadata: true,
        enableComments: false,
        watermarkIntensity: 'medium',
        sortOrder: 'newest',
        inviteOnly: false
      }),
      isPublished: gallery.isPublished || false
    };
    
    console.log('Sending bio:', updateData.photographerBio);
    
    // Make the API request
    const response = await axios.put(
      `http://localhost:5000/api/galleries/${gallery._id}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API Response status:', response.status);
    console.log('Updated gallery bio:', response.data.photographerBio);
    
    // Verify in database
    const updated = await Gallery.findById(gallery._id);
    console.log('Verified in DB - Bio:', updated.photographerBio);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
}

testApiSave();