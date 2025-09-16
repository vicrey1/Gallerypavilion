const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gallerypavilion.com',
      password: 'admin123456', // This will be hashed by the pre-save middleware
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully!');
    console.log('Email: admin@gallerypavilion.com');
    console.log('Password: admin123456');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();