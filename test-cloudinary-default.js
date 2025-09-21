const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://gallerypavilion-q3s8uwhny-vameh09-5178s-projects.vercel.app';
const TEST_EMAIL = 'admin@gallerypavilion.com';
const TEST_PASSWORD = 'admin123456';

async function testCloudinaryDefault() {
    try {
        console.log('🚀 Testing Cloudinary as default storage...');
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
            title: 'Cloudinary Default Test',
            description: 'Testing that Cloudinary is now the default storage',
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
        console.log('\n3. Testing photo upload...');
        
        // Create a simple test image if it doesn't exist
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        if (!fs.existsSync(testImagePath)) {
            console.log('⚠️  Test image not found, creating a placeholder...');
            // Create a minimal JPEG header for testing
            const minimalJpeg = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
                0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
                0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
                0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
                0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
                0x07, 0xFF, 0xD9
            ]);
            fs.writeFileSync(testImagePath, minimalJpeg);
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
                timeout: 60000 // 60 second timeout
            }
        );
        
        console.log('✅ Photo upload successful');
        
        // Step 4: Check if photo uses Cloudinary
        const uploadedPhotos = uploadResponse.data.photos;
        if (uploadedPhotos && uploadedPhotos.length > 0) {
            const firstPhoto = uploadedPhotos[0];
            
            console.log('\n📊 Photo Storage Analysis:');
            console.log('Storage Type:', firstPhoto.storageType);
            
            if (firstPhoto.storageType === 'cloudinary') {
                console.log('✅ SUCCESS: Photo is using Cloudinary storage!');
                
                if (firstPhoto.cloudinary) {
                    console.log('\n🔗 Cloudinary URLs:');
                    console.log('Original URL:', firstPhoto.cloudinary.originalUrl);
                    console.log('Preview URL:', firstPhoto.cloudinary.previewUrl);
                    console.log('Thumbnail URL:', firstPhoto.cloudinary.thumbnailUrl);
                    console.log('Public ID:', firstPhoto.cloudinary.publicId);
                } else {
                    console.log('⚠️  Cloudinary data structure missing');
                }
            } else {
                console.log('❌ ISSUE: Photo is not using Cloudinary storage');
                console.log('Current storage type:', firstPhoto.storageType);
                console.log('Photo data:', JSON.stringify(firstPhoto, null, 2));
            }
        } else {
            console.log('❌ No photos found in upload response');
        }
        
        console.log('\n🎉 Cloudinary default storage test completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testCloudinaryDefault();