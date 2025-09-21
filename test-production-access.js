const https = require('https');
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`Response length: ${data.length}`);
                if (res.statusCode === 200) {
                    console.log('✅ Site is accessible');
                } else {
                    console.log('❌ Site returned error status');
                }
                resolve(data);
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Request failed:', err.message);
            reject(err);
        });
        
        req.setTimeout(10000, () => {
            console.error('❌ Request timed out');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testAccess() {
    console.log('Testing access to production site...');
    
    try {
        await makeRequest('https://www.gallerypavilion.com');
        console.log('\nTrying to access API endpoint...');
        await makeRequest('https://www.gallerypavilion.com/api/health');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAccess();