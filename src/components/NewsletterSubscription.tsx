'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface NewsletterSubscriptionProps {
  className?: string;
}

export default function NewsletterSubscription({ className = '' }: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Successfully subscribed! Thank you for joining our newsletter.');
        setIsSuccess(true);
        setEmail('');
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Stay Updated with <span className="gradient-text">Gallery Pavilion</span>
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Get the latest features, photography tips, and industry insights delivered to your inbox
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address" 
            className="flex-1 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={isLoading}
            required
          />
          <motion.button
            type="submit"
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className="px-8 py-3 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </motion.button>
        </form>
        
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm mt-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}
          >
            {message}
          </motion.p>
        )}
        
        <p className="text-sm text-gray-400 mt-4">
          No spam, unsubscribe at any time. We respect your privacy.
        </p>
      </motion.div>
    </div>
  );
}