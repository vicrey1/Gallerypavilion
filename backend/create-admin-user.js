const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Create admin user for testing
async function createAdminUser() {
  console.log('🔍 Creating Admin User for Testing...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gallerypavilion.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('User details:', {
        id: existingAdmin._id,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status
      });
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        status: 'APPROVED',
        role: 'ADMIN'
      });
      
      console.log('✅ Admin user updated with new password and approved status');
    } else {
      console.log('Creating new admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Create admin user
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        bio: 'System Administrator'
      });
      
      await adminUser.save();
      
      console.log('✅ Admin user created successfully!');
      console.log('User details:', {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      });
    }
    
    // Test login
    console.log('\n🔍 Testing login...');
    const testUser = await User.findOne({ email: adminEmail }).select('+password');
    
    if (testUser && testUser.password) {
      const isPasswordValid = await bcrypt.compare(adminPassword, testUser.password);
      
      if (isPasswordValid) {
        console.log('✅ Password validation successful');
      } else {
        console.log('❌ Password validation failed');
      }
    } else {
      console.log('❌ User not found or password not retrieved');
    }
    
    console.log('\n✅ Admin user setup completed!');
    console.log('Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
createAdminUser();