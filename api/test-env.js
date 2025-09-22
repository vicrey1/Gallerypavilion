// Simple test endpoint to check environment variables
module.exports = (req, res) => {
  const mongoUri = process.env.MONGODB_URI;
  
  res.json({
    success: true,
    hasMongoUri: !!mongoUri,
    mongoUriLength: mongoUri ? mongoUri.length : 0,
    mongoUriStart: mongoUri ? mongoUri.substring(0, 20) + '...' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
};