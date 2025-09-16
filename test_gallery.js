const axios = require('axios');

async function testGalleryCreation() {
  try {
    const response = await axios.post('http://localhost:5000/api/galleries', {
      title: "Test Gallery",
      description: "Test description",
      category: "Portrait",
      collections: [],
      settings: {}
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YjQ3YzQwM2Y0YzQ3YzQyY2Q0YzQyYyIsImVtYWlsIjoicGhvdG9ncmFwaGVyQGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwicm9sZSI6IlBIT1RPR1JBUEhFUiIsInN0YXR1cyI6IkFQUFJPVkVEIiwiaWF0IjoxNzM1MDAwMDAwLCJleHAiOjE3MzUwODY0MDB9.valid_signature_here',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testGalleryCreation();