import axios from 'axios';

const isDevelopment = process.env.NODE_ENV === 'development';
const productionDomain = 'https://www.gallerypavilion.com';

// Create axios instance with base configuration
const instance = axios.create({
    baseURL: isDevelopment ? '/api' : `${productionDomain}/api`,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Add response interceptor to handle errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        if (error.response?.status === 500) {
            console.error('Server Error Details:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default instance;