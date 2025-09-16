import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white mb-4">404</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-8"></div>
        </div>
        
        <h2 className="text-3xl font-serif font-bold text-white mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Go Home
          </Link>
          
          <Link
            to="/login"
            className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
        
        <div className="mt-12">
          <Link to="/" className="text-2xl font-serif font-bold gradient-text">
            Gallery Pavilion
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            Where Photography Meets Exclusivity
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;