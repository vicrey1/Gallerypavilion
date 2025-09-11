'use client'

import { motion } from 'framer-motion'
import { Camera, ArrowLeft, Upload, User, Mail, Phone, Globe, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function PhotographerSignup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    website: '',
    portfolio: '',
    experience: '',
    specialization: '',
    businessName: '',
    bio: '',
    instagram: '',
    equipment: '',
    references: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any previous errors
    setError('')
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check and try again.')
      return
    }
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.portfolio || !formData.experience || !formData.specialization) {
      setError('Please fill in all required fields (marked with *).')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...submitData } = formData
      
      const response = await fetch('/api/auth/photographer-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      setSubmitted(true)
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for your application. We will review your submission and get back to you within 2-3 business days.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 bg-white text-purple-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">Gallery Pavilion</span>
          </Link>
          
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join Our Exclusive Network
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Apply to become a photographer on Gallery Pavilion. We carefully review each application to maintain our high standards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
                >
                  <p className="text-red-200 text-sm font-medium">{error}</p>
                </motion.div>
              )}
              
              {/* Personal Information */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  Personal Information
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter a secure password (min 8 characters)"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+1 (289) 532-4337"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Camera className="h-6 w-6 mr-2" />
                  Professional Information
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your Photography Studio"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Years of Experience *</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="" className="bg-slate-800 text-white">Select experience level</option>
                      <option value="1-2" className="bg-slate-800 text-white">1-2 years</option>
                      <option value="3-5" className="bg-slate-800 text-white">3-5 years</option>
                      <option value="6-10" className="bg-slate-800 text-white">6-10 years</option>
                      <option value="10+" className="bg-slate-800 text-white">10+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Specialization *</label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="" className="bg-slate-800 text-white">Select specialization</option>
                      <option value="wedding" className="bg-slate-800 text-white">Wedding Photography</option>
                      <option value="portrait" className="bg-slate-800 text-white">Portrait Photography</option>
                      <option value="event" className="bg-slate-800 text-white">Event Photography</option>
                      <option value="commercial" className="bg-slate-800 text-white">Commercial Photography</option>
                      <option value="fashion" className="bg-slate-800 text-white">Fashion Photography</option>
                      <option value="landscape" className="bg-slate-800 text-white">Landscape Photography</option>
                      <option value="wildlife" className="bg-slate-800 text-white">Wildlife Photography</option>
                      <option value="other" className="bg-slate-800 text-white">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Portfolio & Social */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Globe className="h-6 w-6 mr-2" />
                  Portfolio & Social Media
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Portfolio URL *</label>
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://portfolio.com or Instagram link"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Instagram Handle</label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="@yourusername"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  Additional Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Professional Bio *</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Tell us about your photography journey, style, and what makes your work unique..."
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Equipment & Technical Skills</label>
                    <textarea
                      name="equipment"
                      value={formData.equipment}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="List your camera equipment, editing software, and technical expertise..."
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">References (Optional)</label>
                    <textarea
                      name="references"
                      value={formData.references}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Provide contact information for professional references or notable clients..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b border-white" style={{borderBottomWidth: '2px'}}></div>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
                <p className="text-gray-400 text-sm mt-4 text-center">
                  By submitting this application, you agree to our terms of service and privacy policy.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}