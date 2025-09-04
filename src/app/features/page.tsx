'use client'

import { motion } from 'framer-motion'
import { Camera, Shield, Users, Zap, Download, Eye, Lock, Smartphone, Globe, BarChart3, Palette, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Camera,
      title: 'Professional Galleries',
      description: 'Create stunning, responsive photo galleries that showcase your work beautifully across all devices.',
      features: ['Customizable layouts', 'Drag & drop organization', 'Bulk upload support', 'Auto-optimization']
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Military-grade encryption and advanced privacy controls keep your clients\' photos completely secure.',
      features: ['Password protection', 'Expiring links', 'Download restrictions', 'Watermark protection']
    },
    {
      icon: Users,
      title: 'Client Experience',
      description: 'Deliver exceptional client experiences with intuitive interfaces and powerful collaboration tools.',
      features: ['Easy photo selection', 'Favorites system', 'Download tracking', 'Mobile-first design']
    },
    {
      icon: Zap,
      title: 'Lightning Performance',
      description: 'Global CDN and optimized delivery ensure your galleries load instantly anywhere in the world.',
      features: ['Global CDN', 'Image optimization', 'Lazy loading', '99.9% uptime']
    }
  ]

  const allFeatures = [
    { icon: Download, title: 'Smart Downloads', description: 'Clients can download individual photos or entire collections with one click' },
    { icon: Eye, title: 'View Tracking', description: 'See which photos your clients view most and track engagement' },
    { icon: Lock, title: 'Access Control', description: 'Set expiration dates and control who can access your galleries' },
    { icon: Smartphone, title: 'Mobile Optimized', description: 'Perfect experience on phones, tablets, and desktop devices' },
    { icon: Globe, title: 'Global Delivery', description: 'Fast loading times worldwide with our global content delivery network' },
    { icon: BarChart3, title: 'Analytics Dashboard', description: 'Detailed insights into gallery performance and client behavior' },
    { icon: Palette, title: 'Custom Branding', description: 'Add your logo, colors, and branding to create a professional experience' },
    { icon: Heart, title: 'Favorites System', description: 'Clients can mark their favorite photos for easy selection and ordering' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Modern Photographers</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Everything you need to create, share, and manage professional photo galleries that wow your clients and grow your business.
            </p>
            <Link href="/auth/photographer-signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300"
              >
                Start Free Trial
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Main Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-300 mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.features.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center space-x-2 text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Complete Feature Set
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover all the tools and capabilities that make Gallery Pavilion the perfect choice for professional photographers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {allFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Workflow Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Streamlined Workflow
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From upload to delivery, our platform simplifies every step of your photography workflow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Upload & Organize',
              description: 'Drag and drop your photos, organize them into collections, and add metadata with ease.'
            },
            {
              step: '02',
              title: 'Customize & Brand',
              description: 'Apply your branding, set privacy controls, and customize the gallery experience for your clients.'
            },
            {
              step: '03',
              title: 'Share & Deliver',
              description: 'Send secure links to clients, track their activity, and deliver final images seamlessly.'
            }
          ].map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integration Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Integrates with Your Favorite Tools
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Connect Gallery Pavilion with the tools you already use to create a seamless photography workflow.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {['Lightroom', 'Photoshop', 'Capture One', 'Dropbox'].map((tool, index) => (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/20 rounded-lg p-4 text-white font-semibold"
              >
                {tool}
              </motion.div>
            ))}
          </div>
          <Link href="/api-docs">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-purple-400 text-purple-400 px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 hover:text-white transition-colors"
            >
              View API Documentation
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your free trial today and see how Gallery Pavilion can transform your photography business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/photographer-signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </motion.button>
            </Link>
            <Link href="/gallery-examples">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                View Examples
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}