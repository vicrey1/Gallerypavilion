'use client'

import { motion } from 'framer-motion'
import { Play, Clock, User, Star, Search, Filter, BookOpen, FileText, Download } from 'lucide-react'
import { useState } from 'react'

export default function TutorialsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'gallery-management', name: 'Gallery Management' },
    { id: 'sharing', name: 'Sharing & Collaboration' },
    { id: 'advanced', name: 'Advanced Features' },
    { id: 'business', name: 'Business Tools' }
  ]

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ]

  const tutorials = [
    {
      id: 1,
      title: 'Getting Started with Gallery Pavilion',
      description: 'Learn the basics of creating your account and uploading your first photos.',
      category: 'getting-started',
      level: 'beginner',
      duration: '5:30',
      views: '12.5K',
      rating: 4.9,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
      resourceUrl: '#',
      featured: true
    },
    {
      id: 2,
      title: 'Creating Your First Gallery',
      description: 'Step-by-step guide to organizing and presenting your photos professionally.',
      category: 'gallery-management',
      level: 'beginner',
      duration: '8:15',
      views: '9.8K',
      rating: 4.8,
      thumbnail: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=225&fit=crop',
      resourceUrl: '#'
    },
    {
      id: 3,
      title: 'Advanced Gallery Customization',
      description: 'Customize layouts, themes, and branding to match your style.',
      category: 'gallery-management',
      level: 'intermediate',
      duration: '12:45',
      views: '7.2K',
      rating: 4.7,
      thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
      videoUrl: '#'
    },
    {
      id: 4,
      title: 'Sharing Galleries with Clients',
      description: 'Learn different ways to share your work and collaborate with clients.',
      category: 'sharing',
      level: 'beginner',
      duration: '6:20',
      views: '11.3K',
      rating: 4.9,
      thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=225&fit=crop',
      videoUrl: '#'
    },
    {
      id: 5,
      title: 'Client Proofing and Feedback',
      description: 'Set up client proofing workflows and collect feedback efficiently.',
      category: 'sharing',
      level: 'intermediate',
      duration: '10:30',
      views: '6.5K',
      rating: 4.6,
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop',
      videoUrl: '#'
    },
    {
      id: 6,
      title: 'Bulk Upload and Organization',
      description: 'Efficiently upload and organize large collections of photos.',
      category: 'advanced',
      level: 'intermediate',
      duration: '9:45',
      views: '5.8K',
      rating: 4.8,
      thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=225&fit=crop',
      videoUrl: '#'
    },
    {
      id: 7,
      title: 'API Integration for Developers',
      description: 'Integrate Gallery Pavilion with your existing workflow using our API.',
      category: 'advanced',
      level: 'advanced',
      duration: '15:20',
      views: '3.2K',
      rating: 4.5,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
      videoUrl: '#'
    },
    {
      id: 8,
      title: 'Business Account Features',
      description: 'Explore team collaboration, client management, and business tools.',
      category: 'business',
      level: 'intermediate',
      duration: '11:15',
      views: '4.7K',
      rating: 4.7,
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop',
      videoUrl: '#'
    }
  ]

  const learningPaths = [
    {
      title: 'Complete Beginner',
      description: 'Perfect for photographers new to online galleries',
      tutorials: [1, 2, 4],
      duration: '20 minutes',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Professional Photographer',
      description: 'Advanced features for professional workflows',
      tutorials: [3, 5, 6, 8],
      duration: '44 minutes',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Developer Integration',
      description: 'Technical tutorials for developers',
      tutorials: [7],
      duration: '15 minutes',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory
    const matchesLevel = selectedLevel === 'all' || tutorial.level === selectedLevel
    const matchesSearch = searchQuery === '' || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesLevel && matchesSearch
  })

  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-800/20 to-orange-800/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Learning
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> Resources</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Master Gallery Pavilion with our comprehensive guides and tutorials. From basics to advanced features.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-16"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id} className="bg-gray-800">
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level.id} value={level.id} className="bg-gray-800">
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Featured Tutorials</h2>
            <p className="text-gray-300">Start with these essential tutorials to get the most out of Gallery Pavilion.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {featuredTutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                    Featured
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {tutorial.duration}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tutorial.title}</h3>
                  <p className="text-gray-300 mb-4">{tutorial.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{tutorial.views} views</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{tutorial.rating}</span>
                      </span>
                    </div>
                    <span className="capitalize bg-red-500/20 text-red-300 px-2 py-1 rounded">
                      {tutorial.level}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Paths */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Learning Paths</h2>
          <p className="text-gray-300">Structured learning paths to guide your journey with Gallery Pavilion.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {learningPaths.map((path, index) => (
            <motion.div
              key={path.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className={`bg-gradient-to-r ${path.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{path.title}</h3>
              <p className="text-gray-300 mb-4">{path.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>{path.tutorials.length} tutorials</span>
                <span>{path.duration}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full bg-gradient-to-r ${path.color} text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                Start Learning
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Tutorials */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">All Tutorials</h2>
          <p className="text-gray-300">Browse our complete library of learning resources and guides.</p>
        </motion.div>
        
        {filteredTutorials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:bg-white/15 transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {tutorial.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2">{tutorial.title}</h3>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{tutorial.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{tutorial.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span>{tutorial.rating}</span>
                      </span>
                    </div>
                    <span className="capitalize bg-red-500/20 text-red-300 px-2 py-1 rounded">
                      {tutorial.level}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-300 mb-4">
                We couldn&apos;t find any learning resources matching your criteria. Try adjusting your filters or search terms.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedLevel('all'); }}
                className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Clear Filters
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Additional Resources */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Start Guide</h3>
              <p className="text-gray-300 text-sm mb-4">Download our PDF guide for offline reference</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Download PDF
              </motion.button>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
              <p className="text-gray-300 text-sm mb-4">Comprehensive written guides and references</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                View Docs
              </motion.button>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-300 text-sm mb-4">Connect with other photographers and get help</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Join Community
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}