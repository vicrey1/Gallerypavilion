const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple cookie storage
let authCookies = '';

// Create axios instance
const axiosInstance = axios.create({
  timeout: 60000
});

// Add request interceptor to include cookies
axiosInstance.interceptors.request.use((config) => {
  if (authCookies) {
    config.headers.Cookie = authCookies;
  }
  return config;
});

// Add response interceptor to capture cookies
axiosInstance.interceptors.response.use((response) => {
  if (response.headers['set-cookie']) {
    authCookies = response.headers['set-cookie'].join('; ');
  }
  return response;
});

// Test photo upload endpoint
async function testPhotoUpload() {
  console.log('🔍 Testing Photo Upload Endpoint...');
  
  const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
  console.log('Backend URL:', baseURL);
  
  try {
    // First, let's test authentication
    console.log('\n1. Testing authentication...');
    const loginData = {
      email: process.env.ADMIN_EMAIL || 'admin@gallerypavilion.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456'
    };
    
    console.log('Login attempt with:', { email: loginData.email, password: '***' });
    
    const loginResponse = await axiosInstance.post(`${baseURL}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginResponse.data);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    console.log('✅ Authentication successful (using cookies)');
    
    // Get user galleries
    console.log('\n2. Getting user galleries...');
    const galleriesResponse = await axiosInstance.get(`${baseURL}/api/galleries`);
    
    if (!galleriesResponse.data.galleries || galleriesResponse.data.galleries.length === 0) {
      console.log('No galleries found. Creating a test gallery...');
      
      const newGalleryResponse = await axiosInstance.post(`${baseURL}/api/galleries`, {
        title: 'Test Gallery for Upload',
        description: 'Test gallery created for upload testing',
        isPublished: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Test gallery created:', newGalleryResponse.data._id);
      var galleryId = newGalleryResponse.data._id;
    } else {
      var galleryId = galleriesResponse.data.galleries[0]._id;
      console.log('✅ Using existing gallery:', galleryId);
    }
    
    // Create a proper test image using Sharp
    console.log('\n3. Creating test image...');
    const sharp = require('sharp');
    
    // Create a 100x100 red square PNG image as buffer
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .png()
    .toBuffer();
    
    console.log(`✅ Test image buffer created: ${testImageBuffer.length} bytes`);
    console.log(`Buffer type: ${typeof testImageBuffer}`);
    console.log(`Is Buffer: ${Buffer.isBuffer(testImageBuffer)}`);
    
    // Test photo upload
     console.log('\n4. Testing photo upload from buffer...');
     const formData = new FormData();
     formData.append('photos', testImageBuffer, {
       filename: 'test-image.png',
       contentType: 'image/png'
     });
    
    console.log('Uploading to:', `${baseURL}/api/galleries/${galleryId}/photos`);
    
    const uploadResponse = await axiosInstance.post(
      `${baseURL}/api/galleries/${galleryId}/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 60000, // 60 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log('✅ Photo upload successful!');
    console.log('Response:', {
      message: uploadResponse.data.message,
      photosCount: uploadResponse.data.photos?.length || 0,
      errors: uploadResponse.data.errors || 'None'
    });
    
    if (uploadResponse.data.photos && uploadResponse.data.photos.length > 0) {
      const photo = uploadResponse.data.photos[0];
      console.log('Photo details:', {
        id: photo._id,
        title: photo.title,
        filename: photo.filename,
        size: photo.size,
        processingStatus: photo.processingStatus
      });
    }
    
    console.log('\n✅ All photo upload tests passed!');
    
  } catch (error) {
    console.error('❌ Photo upload test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    console.error('\nTroubleshooting steps:');
    console.error('1. Check if backend server is running');
    console.error('2. Verify authentication credentials');
    console.error('3. Check network connectivity');
    console.error('4. Verify MongoDB connection');
    console.error('5. Check GridFS configuration');
  }
}

// Run the test
testPhotoUpload();