'use client'

import { motion } from 'framer-motion'
import { Calendar, User, Clock, ArrowRight, Search, Tag, TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Posts', count: 24 },
    { id: 'photography-tips', name: 'Photography Tips', count: 8 },
    { id: 'business', name: 'Business', count: 6 },
    { id: 'tutorials', name: 'Tutorials', count: 5 },
    { id: 'industry-news', name: 'Industry News', count: 3 },
    { id: 'client-stories', name: 'Client Stories', count: 2 }
  ]

  const blogPosts = [
    {
      id: 1,
      title: '10 Essential Tips for Creating Stunning Client Galleries',
      excerpt: 'Learn how to curate and present your photography work in a way that captivates clients and drives bookings.',
      content: 'Full article content here...',
      author: 'Sarah Johnson',
      authorImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-15',
      readTime: '8 min read',
      category: 'photography-tips',
      tags: ['galleries', 'client-work', 'presentation'],
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=300&fit=crop',
      views: 2847,
      likes: 156,
      comments: 23,
      featured: true
    },
    {
      id: 2,
      title: 'How to Price Your Photography Services: A Complete Guide',
      excerpt: 'Discover proven strategies for pricing your photography services competitively while maintaining profitability.',
      content: 'Full article content here...',
      author: 'Michael Chen',
      authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-12',
      readTime: '12 min read',
      category: 'business',
      tags: ['pricing', 'business', 'strategy'],
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=300&fit=crop',
      views: 1923,
      likes: 89,
      comments: 15,
      featured: true
    },
    {
      id: 3,
      title: 'The Future of Photography: AI and Digital Innovation',
      excerpt: 'Explore how artificial intelligence and digital tools are reshaping the photography industry.',
      content: 'Full article content here...',
      author: 'Emma Rodriguez',
      authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-10',
      readTime: '6 min read',
      category: 'industry-news',
      tags: ['ai', 'technology', 'future'],
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=300&fit=crop',
      views: 3156,
      likes: 234,
      comments: 45
    },
    {
      id: 4,
      title: 'Building Your Photography Brand: From Vision to Reality',
      excerpt: 'Step-by-step guide to developing a strong brand identity that attracts your ideal clients.',
      content: 'Full article content here...',
      author: 'David Park',
      authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-08',
      readTime: '10 min read',
      category: 'business',
      tags: ['branding', 'marketing', 'identity'],
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=300&fit=crop',
      views: 1654,
      likes: 98,
      comments: 12
    },
    {
      id: 5,
      title: 'Mastering Natural Light: Techniques for Every Photographer',
      excerpt: 'Learn to work with natural light in any condition to create stunning, professional photographs.',
      content: 'Full article content here...',
      author: 'Lisa Thompson',
      authorImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-05',
      readTime: '7 min read',
      category: 'photography-tips',
      tags: ['lighting', 'techniques', 'natural-light'],
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=300&fit=crop',
      views: 2234,
      likes: 167,
      comments: 28
    },
    {
      id: 6,
      title: 'Client Communication: Building Lasting Relationships',
      excerpt: 'Effective communication strategies that turn one-time clients into lifelong advocates for your work.',
      content: 'Full article content here...',
      author: 'James Wilson',
      authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
      publishDate: '2024-01-03',
      readTime: '9 min read',
      category: 'business',
      tags: ['communication', 'clients', 'relationships'],
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=300&fit=crop',
      views: 1456,
      likes: 76,
      comments: 18
    }
  ]

  const trendingPosts = blogPosts
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const featuredPosts = blogPosts.filter(post => post.featured)

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
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Photography
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> Blog</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Insights, tips, and stories from the world of professional photography. Stay inspired and informed.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-16"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category.name} ({category.count})
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Featured Articles</h2>
            <p className="text-gray-300">Our most popular and insightful content to help grow your photography business.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {featuredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-colors group"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-red-500 to-orange-500" />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {post.readTime}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-medium capitalize">
                      {post.category.replace('-', ' ')}
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{post.publishDate}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-300 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
                      <div>
                        <p className="text-white text-sm font-medium">{post.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                      <span className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Latest Articles</h2>
              <p className="text-gray-300">Stay up to date with the latest photography trends, tips, and industry insights.</p>
            </motion.div>
            
            {filteredPosts.length > 0 ? (
              <div className="space-y-8">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:bg-white/15 transition-colors group"
                  >
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <div className="aspect-video md:aspect-square bg-gradient-to-br from-red-500 to-orange-500" />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-medium capitalize">
                            {post.category.replace('-', ' ')}
                          </span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-400 text-xs">{post.publishDate}</span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-400 text-xs">{post.readTime}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-300 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-300 mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
                            <div>
                              <p className="text-white text-sm font-medium">{post.author}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-gray-400 text-sm">
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{post.views.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                  <p className="text-gray-300 mb-4">
                    We couldn&apos;t find any articles matching your criteria. Try adjusting your search or category filter.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Trending Posts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8"
            >
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Trending</h3>
              </div>
              <div className="space-y-4">
                {trendingPosts.map((post, index) => (
                  <div key={post.id} className="flex items-start space-x-3 group cursor-pointer">
                    <div className="text-red-400 font-bold text-lg min-w-[24px]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm group-hover:text-red-300 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                        <span>{post.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Newsletter Signup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30"
            >
              <h3 className="text-lg font-bold text-white mb-3">Stay Updated</h3>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest photography tips and industry insights delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Subscribe
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}