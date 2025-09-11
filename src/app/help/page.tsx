'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Search, Book, MessageCircle, Mail, Phone, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: Book },
    { id: 'galleries', name: 'Gallery Management', icon: Book },
    { id: 'account', name: 'Account & Billing', icon: MessageCircle },
    { id: 'technical', name: 'Technical Issues', icon: Search }
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create my first photo gallery?',
      answer: 'To create your first gallery, log into your account and click "Create New Gallery" from your dashboard. Upload your photos, add titles and descriptions, then choose your privacy settings. Your gallery will be ready to share!'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'What file formats are supported?',
      answer: 'We support all major image formats including JPEG, PNG, TIFF, RAW files (CR2, NEF, ARW), and HEIC. Maximum file size is 50MB per image for Pro accounts and 10MB for free accounts.'
    },
    {
      id: 3,
      category: 'galleries',
      question: 'How do I share my gallery with clients?',
      answer: 'You can share galleries by generating a unique link, sending email invitations, or creating a password-protected gallery. Go to your gallery settings and choose your preferred sharing method.'
    },
    {
      id: 4,
      category: 'galleries',
      question: 'Can I organize photos into collections?',
      answer: 'Yes! You can create collections within your galleries to organize photos by theme, event, or any criteria you choose. Collections help clients navigate large galleries more easily.'
    },
    {
      id: 5,
      category: 'account',
      question: 'How do I upgrade my subscription?',
      answer: 'Go to Account Settings > Billing to view available plans and upgrade. Changes take effect immediately, and you\'ll only pay the prorated difference for the current billing period.'
    },
    {
      id: 6,
      category: 'account',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel anytime from your account settings. Your account will remain active until the end of your current billing period, and you\'ll retain access to all features until then.'
    },
    {
      id: 7,
      category: 'technical',
      question: 'Why are my photos uploading slowly?',
      answer: 'Upload speed depends on your internet connection and file sizes. For faster uploads, try reducing image file sizes, uploading during off-peak hours, or using our desktop app for bulk uploads.'
    },
    {
      id: 8,
      category: 'technical',
      question: 'My gallery isn\'t loading properly. What should I do?',
      answer: 'Try refreshing the page, clearing your browser cache, or trying a different browser. If the issue persists, check our status page or contact support with details about your browser and device.'
    }
  ]

  const supportOptions = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      availability: 'Mon-Fri, 9AM-6PM EST',
      action: 'Start Chat',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      availability: 'Response within 24 hours',
      action: 'Send Email',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: Phone,
      availability: 'Pro & Business plans only',
      action: 'Call Now',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/20 to-purple-800/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Help
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Center</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Find answers to your questions and get the support you need to make the most of Gallery Pavilion.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles, tutorials, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </motion.div>
      </div>

      {/* Support Options */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Get Support</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Choose the support option that works best for you. Our team is here to help!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center hover:bg-white/15 transition-colors"
            >
              <div className={`bg-gradient-to-r ${option.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <option.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
              <p className="text-gray-300 mb-4">{option.description}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-4">
                <Clock className="h-4 w-4" />
                <span>{option.availability}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full bg-gradient-to-r ${option.color} text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                {option.action}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-300">
            Find quick answers to the most common questions about Gallery Pavilion.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
            >
              <details className="group">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors">
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center group-open:rotate-45 transition-transform">
                      <div className="w-3 h-0.5 bg-white absolute" />
                      <div className="w-0.5 h-3 bg-white absolute" />
                    </div>
                  </div>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            </motion.div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-300 mb-4">
                We couldn&apos;t find any FAQs matching your search. Try different keywords or browse all categories.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors"
              >
                Clear Search
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-6">

            
            <Link href="/contact">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MessageCircle className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">Contact Support</h3>
                <p className="text-gray-300 text-sm">Get personalized help</p>
              </motion.div>
            </Link>
            
            <a href="/status" target="_blank" rel="noopener noreferrer">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Clock className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">System Status</h3>
                <p className="text-gray-300 text-sm">Check service availability</p>
              </motion.div>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Still Need Help */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-indigo-100 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is ready to help you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </motion.button>
            </Link>
            <a href="mailto:support@gallerypavilion.com">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Email Us
              </motion.button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}