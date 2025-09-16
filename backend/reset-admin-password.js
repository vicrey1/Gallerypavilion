const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'ADMIN', email: 'admin@gallerypavilion.com' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Reset password (let pre-save middleware handle hashing)
    const newPassword = 'admin123456';
    
    admin.password = newPassword; // This will be hashed by pre-save middleware
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    
    await admin.save();

    console.log('Admin password reset successfully!');
    console.log('Email: admin@gallerypavilion.com');
    console.log('Password: admin123456');

  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetAdminPassword();