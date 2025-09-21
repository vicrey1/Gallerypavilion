const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Production URL
const PRODUCTION_URL = 'https://gallerypavilion-pr45y3bym-vameh09-5178s-projects.vercel.app';

// Test credentials
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'your-admin-password';

async function testUploadWithDebug() {
    try {
        console.log('🔍 Starting upload debug test...');
        
        // Step 1: Login
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post(
            `${PRODUCTION_URL}/api/auth/login`,
            {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            },
            {
                timeout: 10000
            }
        );
        
        const authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Get galleries
        console.log('\n2. Getting galleries...');
        const galleriesResponse = await axios.get(
            `${PRODUCTION_URL}/api/galleries`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: 10000
            }
        );
        
        const galleries = galleriesResponse.data;
        if (!galleries || galleries.length === 0) {
            console.log('❌ No galleries found');
            return;
        }
        
        const galleryId = galleries[0]._id;
        console.log(`✅ Using gallery: ${galleries[0].title} (${galleryId})`);
        
        // Step 3: Upload photo with detailed logging
        console.log('\n3. Uploading photo...');
        const testImagePath = path.join(__dirname, 'backend', 'test-image.png');
        
        if (!fs.existsSync(testImagePath)) {
            console.log('❌ Test image not found at:', testImagePath);
            console.log('Available files in backend:');
            const backendFiles = fs.readdirSync(path.join(__dirname, 'backend'));
            backendFiles.filter(f => f.includes('test') || f.includes('image')).forEach(f => {
                console.log('  -', f);
            });
            return;
        }
        
        const formData = new FormData();
        formData.append('photos', fs.createReadStream(testImagePath));
        
        console.log('📤 Sending upload request...');
        console.log('URL:', `${PRODUCTION_URL}/api/galleries/${galleryId}/photos`);
        console.log('File:', testImagePath);
        
        const uploadResponse = await axios.post(
            `${PRODUCTION_URL}/api/galleries/${galleryId}/photos`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    ...formData.getHeaders()
                },
                timeout: 60000, // 60 second timeout
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        
        console.log('✅ Upload successful!');
        console.log('Response status:', uploadResponse.status);
        console.log('Response data:', JSON.stringify(uploadResponse.data, null, 2));
        
        // Check if Cloudinary was used
        const uploadedPhotos = uploadResponse.data.photos || uploadResponse.data;
        const firstPhoto = Array.isArray(uploadedPhotos) ? uploadedPhotos[0] : uploadedPhotos;
        
        console.log('\n📊 Storage Analysis:');
        console.log('Storage Type:', firstPhoto.storageType);
        
        if (firstPhoto.storageType === 'cloudinary') {
            console.log('✅ Using Cloudinary storage');
            console.log('Cloudinary Public ID:', firstPhoto.cloudinary?.publicId);
            console.log('Original URL:', firstPhoto.cloudinary?.originalUrl);
            console.log('Preview URL:', firstPhoto.cloudinary?.previewUrl);
            console.log('Thumbnail URL:', firstPhoto.cloudinary?.thumbnailUrl);
        } else {
            console.log('⚠️  Not using Cloudinary storage');
            console.log('Original Key:', firstPhoto.originalKey);
            console.log('Preview Key:', firstPhoto.previewKey);
            console.log('Thumbnail Key:', firstPhoto.thumbnailKey);
        }
        
        console.log('\n🎉 Debug test completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

// Run the test
testUploadWithDebug();