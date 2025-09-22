const mongoose = require('mongoose');

export default async function handler(req, res) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return res.status(500).json({
        success: false,
        error: 'MONGODB_URI environment variable not set'
      });
    }

    // Log connection attempt
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI exists:', !!mongoUri);
    console.log('MongoDB URI length:', mongoUri.length);
    console.log('MongoDB URI start:', mongoUri.substring(0, 20) + '...');
    
    // Check current connection state
    const currentState = mongoose.connection.readyState;
    console.log('Current connection state:', currentState);
    
    // If already connected, return success
    if (currentState === 1) {
      return res.status(200).json({
        success: true,
        message: 'Already connected to MongoDB',
        connectionState: currentState,
        timestamp: new Date().toISOString()
      });
    }
    
    // Close any existing connection
    if (currentState !== 0) {
      await mongoose.disconnect();
    }
    
    // Set connection options optimized for serverless
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false
    };
    
    // Attempt connection with timeout
    console.log('Attempting to connect to MongoDB...');
    const connectionPromise = mongoose.connect(mongoUri, options);
    
    // Add a timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('MongoDB connection successful!');
    
    // Test a simple operation
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    
    console.log('MongoDB ping successful:', result);
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      connectionState: mongoose.connection.readyState,
      pingResult: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      connectionState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
}