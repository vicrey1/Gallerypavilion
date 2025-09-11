'use client'

import { motion } from 'framer-motion'
import { Camera, Heart, Download, Eye, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function GalleryExamplesPage() {
  const galleryTypes = [
    {
      title: 'Wedding Photography',
      description: 'Elegant galleries perfect for sharing wedding memories with couples and families.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
      features: ['Password protection', 'Guest favorites', 'High-res downloads', 'Mobile optimized'],
      demoLink: '/gallery/demo',
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Portrait Sessions',
      description: 'Professional portrait galleries with client proofing and selection tools.',
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop',
      features: ['Client proofing', 'Watermark protection', 'Print ordering', 'Social sharing'],
      demoLink: '/gallery/demo',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Event Photography',
      description: 'Large-scale event galleries with advanced organization and search capabilities.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop',
      features: ['Bulk downloads', 'Search by tags', 'Guest uploads', 'Analytics'],
      demoLink: '/gallery/demo',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Commercial Projects',
      description: 'Professional galleries for business clients with branding and collaboration features.',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
      features: ['Custom branding', 'Team collaboration', 'Usage rights', 'API access'],
      demoLink: '/gallery/demo',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Family Photography',
      description: 'Warm, inviting galleries perfect for sharing precious family moments.',
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
      features: ['Family sharing', 'Memory books', 'Print packages', 'Mobile apps'],
      demoLink: '/gallery/demo',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Fashion & Beauty',
      description: 'Stunning galleries that showcase fashion and beauty work with style.',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop',
      features: ['Portfolio mode', 'Model releases', 'Agency access', 'Social integration'],
      demoLink: '/gallery/demo',
      color: 'from-violet-500 to-purple-500'
    }
  ]

  const features = [
    {
      icon: Camera,
      title: 'Professional Layouts',
      description: 'Choose from multiple gallery layouts designed for different photography styles'
    },
    {
      icon: Lock,
      title: 'Privacy Controls',
      description: 'Set passwords, expiration dates, and download permissions for each gallery'
    },
    {
      icon: Heart,
      title: 'Client Favorites',
      description: 'Let clients mark their favorite photos for easy selection and ordering'
    },
    {
      icon: Download,
      title: 'Smart Downloads',
      description: 'Flexible download options including individual photos, collections, or full galleries'
    },
    {
      icon: Eye,
      title: 'View Analytics',
      description: 'Track which photos are viewed most and understand client preferences'
    },
    {
      icon: Users,
      title: 'Guest Access',
      description: 'Allow guests to view, comment, and even upload their own photos to events'
    }
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
              Gallery
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Examples</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore different gallery styles and see how Gallery Pavilion adapts to every type of photography business.
            </p>
            <Link href="/gallery/demo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300"
              >
                View Live Demo
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Gallery Types */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Perfect for Every Photography Style
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our galleries are designed to showcase different types of photography beautifully and professionally.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {galleryTypes.map((gallery, index) => (
            <motion.div
              key={gallery.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 group hover:scale-105 transition-transform duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${gallery.color} opacity-80`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-3">{gallery.title}</h3>
                <p className="text-gray-300 mb-6">{gallery.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {gallery.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href={gallery.demoLink}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full bg-gradient-to-r ${gallery.color} text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300`}
                  >
                    View Example
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features in Every Gallery
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Every gallery type includes our full suite of professional features designed to enhance your client experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Customization Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Fully Customizable to Match Your Brand
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Every gallery can be customized with your logo, colors, and branding to create a cohesive professional experience.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[
              { title: 'Custom Colors', description: 'Match your brand colors perfectly' },
              { title: 'Logo Integration', description: 'Add your logo to every gallery' },
              { title: 'Custom Domains', description: 'Use your own domain for galleries' }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/20 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
          <Link href="/features">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-purple-400 text-purple-400 px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 hover:text-white transition-colors"
            >
              Learn More About Features
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            What Photographers Are Saying
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "The wedding galleries are absolutely stunning. My clients love how easy it is to view and download their photos.",
              author: "Sarah Johnson",
              role: "Wedding Photographer"
            },
            {
              quote: "Perfect for my portrait business. The client proofing features have streamlined my entire workflow.",
              author: "Mike Chen",
              role: "Portrait Photographer"
            },
            {
              quote: "The event galleries handle thousands of photos effortlessly. My corporate clients are always impressed.",
              author: "Lisa Rodriguez",
              role: "Event Photographer"
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20"
            >
              <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
              <div className="text-white font-semibold">{testimonial.author}</div>
              <div className="text-gray-400 text-sm">{testimonial.role}</div>
            </motion.div>
          ))}
        </div>
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
            Ready to Create Your Own Stunning Galleries?
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
            <Link href="/gallery/demo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                Try Live Demo
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}