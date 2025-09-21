require('dotenv').config({ path: './backend/.env' });
const { isCloudinaryConfigured } = require('./backend/utils/cloudinaryStorage');

console.log('Testing Cloudinary configuration...');
console.log('Environment variables:');
console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set'}`);
console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`\nCloudinary configured: ${isCloudinaryConfigured() ? '✅ Yes' : '❌ No'}`);

// Also check the default storage setting
console.log(`\nDEFAULT_STORAGE: ${process.env.DEFAULT_STORAGE || 'Not set'}`);

// Check if the storage detection functions work
const { isCloudStorageConfigured } = require('./backend/utils/cloudStorage');
const { isGridFSAvailable } = require('./backend/utils/gridfsStorage');

console.log(`\nStorage detection:`);
console.log(`- Cloudinary: ${isCloudinaryConfigured()}`);
console.log(`- Cloud Storage (S3): ${isCloudStorageConfigured()}`);
console.log(`- GridFS: ${isGridFSAvailable()}`);