const https = require('https');
const querystring = require('querystring');

function makePostRequest(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Test-Script/1.0'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log(`POST ${url} - Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`Response: ${data.substring(0, 200)}...`);
                resolve({ status: res.statusCode, data });
            });
        });
        
        req.on('error', (err) => {
            console.error(`❌ POST request failed:`, err.message);
            reject(err);
        });
        
        req.setTimeout(10000, () => {
            console.error('❌ POST request timed out');
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.write(postData);
        req.end();
    });
}

function makeGetRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            console.log(`GET ${url} - Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`Response length: ${data.length}`);
                resolve({ status: res.statusCode, data });
            });
        });
        
        req.on('error', (err) => {
            console.error(`❌ GET request failed:`, err.message);
            reject(err);
        });
        
        req.setTimeout(10000, () => {
            console.error('❌ GET request timed out');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testBackendActivity() {
    console.log('Testing backend activity...');
    
    try {
        // Try to access galleries endpoint (should hit backend)
        console.log('\n1. Testing galleries endpoint...');
        await makeGetRequest('https://www.gallerypavilion.com/api/galleries');
        
        // Try to login (should definitely hit backend)
        console.log('\n2. Testing login endpoint...');
        await makePostRequest('https://www.gallerypavilion.com/api/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        
        // Try to access photos endpoint
        console.log('\n3. Testing photos endpoint...');
        await makeGetRequest('https://www.gallerypavilion.com/api/photos');
        
        console.log('\n✅ All requests completed - check Vercel logs for activity');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testBackendActivity();