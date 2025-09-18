const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Production URL - using the most recent working deployment
const PRODUCTION_URL = 'https://gallerypavilion-pr45y3bym-vameh09-5178s-projects.vercel.app';

// Test credentials (you'll need to replace these with actual test credentials)
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'your-admin-password';

async function testProductionCloudinary() {
    try {
        console.log('🚀 Testing Cloudinary integration in production...');
        console.log('Production URL:', PRODUCTION_URL);
        
        // Step 1: Login to get auth token
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        if (!loginResponse.data.token) {
            throw new Error('Failed to get auth token');
        }
        
        const authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Create a test gallery
        console.log('\n2. Creating test gallery...');
        const galleryResponse = await axios.post(`${PRODUCTION_URL}/api/galleries`, {
            title: 'Cloudinary Test Gallery',
            description: 'Testing Cloudinary integration in production',
            isPublic: true
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const galleryId = galleryResponse.data._id;
        console.log('✅ Gallery created:', galleryId);
        
        // Step 3: Test photo upload
        console.log('\n3. Testing photo upload with Cloudinary...');
        
        // Check if test image exists
        const testImagePath = path.join(__dirname, 'backend', 'test-image.jpg');
        if (!fs.existsSync(testImagePath)) {
            console.log('❌ Test image not found at:', testImagePath);
            console.log('Please ensure test-image.jpg exists in the backend folder');
            return;
        }
        
        const formData = new FormData();
        formData.append('photos', fs.createReadStream(testImagePath));
        
        const uploadResponse = await axios.post(
            `${PRODUCTION_URL}/api/galleries/${galleryId}/photos`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    ...formData.getHeaders()
                },
                timeout: 30000 // 30 second timeout
            }
        );
        
        console.log('✅ Photo upload successful');
        console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
        
        // Step 4: Check if photo has Cloudinary URLs
        const uploadedPhotos = uploadResponse.data.photos || uploadResponse.data;
        const firstPhoto = Array.isArray(uploadedPhotos) ? uploadedPhotos[0] : uploadedPhotos;
        
        if (firstPhoto.cloudinaryUrl) {
            console.log('\n✅ Cloudinary integration working!');
            console.log('Cloudinary URL:', firstPhoto.cloudinaryUrl);
            console.log('Storage Type:', firstPhoto.storageType);
            
            // Test preview URL
            if (firstPhoto.previewUrl) {
                console.log('Preview URL:', firstPhoto.previewUrl);
            }
            
            // Test thumbnail URL
            if (firstPhoto.thumbnailUrl) {
                console.log('Thumbnail URL:', firstPhoto.thumbnailUrl);
            }
        } else {
            console.log('\n⚠️  Photo uploaded but no Cloudinary URL found');
            console.log('Photo data:', JSON.stringify(firstPhoto, null, 2));
        }
        
        console.log('\n🎉 Production Cloudinary test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testProductionCloudinary();