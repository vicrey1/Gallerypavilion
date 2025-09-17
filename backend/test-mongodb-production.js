const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Test MongoDB connection and GridFS functionality
async function testMongoDBProduction() {
  console.log('🔍 Testing MongoDB Production Connection...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Test GridFS bucket initialization
    const photoBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'photos'
    });
    
    console.log('✅ GridFS photo bucket initialized successfully');
    
    // Test basic GridFS operations
    console.log('🔍 Testing GridFS operations...');
    
    // Create a test buffer
    const testBuffer = Buffer.from('Test image data for GridFS');
    const testFilename = `test-${Date.now()}.txt`;
    
    // Upload test file
    const uploadStream = photoBucket.openUploadStream(testFilename, {
      metadata: {
        test: true,
        uploadedAt: new Date()
      }
    });
    
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', resolve);
      uploadStream.end(testBuffer);
    });
    
    const uploadResult = await uploadPromise;
    console.log('✅ Test file uploaded to GridFS:', uploadResult._id);
    
    // List files in bucket
    const files = await photoBucket.find({}).toArray();
    console.log(`📁 Total files in GridFS bucket: ${files.length}`);
    
    // Clean up test file
    await photoBucket.delete(uploadResult._id);
    console.log('🗑️ Test file cleaned up');
    
    console.log('\n✅ All MongoDB and GridFS tests passed!');
    
  } catch (error) {
    console.error('❌ MongoDB/GridFS test failed:', error);
    
    if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network error - check internet connection and MongoDB Atlas whitelist');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('🔌 Server selection error - MongoDB cluster may be down or unreachable');
    } else if (error.name === 'MongoParseError') {
      console.error('🔗 Connection string parse error - check MONGODB_URI format');
    }
    
    console.error('\nTroubleshooting steps:');
    console.error('1. Verify MongoDB Atlas cluster is running');
    console.error('2. Check IP whitelist in MongoDB Atlas');
    console.error('3. Verify connection string credentials');
    console.error('4. Check network connectivity');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the test
testMongoDBProduction();