'use client'

import { motion } from 'framer-motion'
import { Cookie, Settings, Shield, BarChart3, User, Globe } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    marketing: false,
    preferences: true
  })

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      icon: Shield,
      required: true,
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      examples: [
        'Authentication tokens to keep you logged in',
        'Security tokens to prevent CSRF attacks',
        'Session identifiers for maintaining your session',
        'Load balancing cookies for optimal performance'
      ],
      duration: 'Session or up to 1 year'
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      icon: BarChart3,
      required: false,
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: [
        'Google Analytics for usage statistics',
        'Page view tracking and user journey analysis',
        'Performance monitoring and error tracking',
        'A/B testing for feature improvements'
      ],
      duration: 'Up to 2 years'
    },
    {
      id: 'preferences',
      title: 'Preference Cookies',
      icon: User,
      required: false,
      description: 'These cookies remember your preferences and settings to enhance your experience.',
      examples: [
        'Theme preferences (dark/light mode)',
        'Language and region settings',
        'Gallery view preferences',
        'Notification preferences'
      ],
      duration: 'Up to 1 year'
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      icon: Globe,
      required: false,
      description: 'These cookies are used to deliver relevant advertisements and track campaign effectiveness.',
      examples: [
        'Social media integration cookies',
        'Advertising network cookies',
        'Conversion tracking pixels',
        'Retargeting campaign cookies'
      ],
      duration: 'Up to 1 year'
    }
  ]

  const handlePreferenceChange = (type: string, value: boolean) => {
    if (type === 'essential') return // Cannot disable essential cookies
    setPreferences(prev => ({ ...prev, [type]: value }))
  }

  const savePreferences = () => {
    // In a real implementation, this would save to localStorage and update cookie consent
    console.log('Saving cookie preferences:', preferences)
    alert('Cookie preferences saved successfully!')
  }

  const lastUpdated = 'December 15, 2024'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-800/20 to-yellow-800/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 w-16 h-16 rounded-full flex items-center justify-center">
                <Cookie className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Cookie
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent"> Policy</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Learn about how we use cookies to enhance your experience and protect your privacy.
            </p>
            <p className="text-gray-400">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
          <p className="text-gray-300 mb-4">
            Cookies are small text files that are stored on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences, 
            keeping you logged in, and helping us understand how you use our service.
          </p>
          <p className="text-gray-300">
            We use different types of cookies for various purposes, and you have control over 
            which non-essential cookies you want to accept. Below you'll find detailed information 
            about each type of cookie we use and how you can manage your preferences.
          </p>
        </motion.div>
      </div>

      {/* Cookie Types */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {cookieTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center">
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{type.title}</h2>
                    {type.required && (
                      <span className="text-sm text-orange-400 font-medium">Required</span>
                    )}
                  </div>
                </div>
                {!type.required && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[type.id as keyof typeof preferences]}
                      onChange={(e) => handlePreferenceChange(type.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                )}
              </div>
              
              <p className="text-gray-300 mb-6">{type.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Examples</h3>
                  <ul className="space-y-2">
                    {type.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Duration</h3>
                  <p className="text-gray-300 text-sm">{type.duration}</p>
                  
                  <h3 className="text-lg font-semibold text-white mb-3 mt-4">Purpose</h3>
                  <p className="text-gray-300 text-sm">
                    {type.id === 'essential' && 'Ensure website functionality and security'}
                    {type.id === 'analytics' && 'Improve user experience and website performance'}
                    {type.id === 'preferences' && 'Remember your settings and preferences'}
                    {type.id === 'marketing' && 'Deliver relevant content and measure effectiveness'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cookie Management */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Settings className="h-8 w-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Manage Your Cookie Preferences</h2>
          </div>
          
          <p className="text-orange-100 mb-6">
            You can control which cookies you accept using the toggles above. Your preferences 
            will be saved and applied to your future visits. Note that disabling certain cookies 
            may affect website functionality.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={savePreferences}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Save Preferences
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPreferences({ essential: true, analytics: false, marketing: false, preferences: false })}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Accept Essential Only
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPreferences({ essential: true, analytics: true, marketing: true, preferences: true })}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Accept All
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Third-Party Cookies */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Third-Party Cookies</h2>
          <p className="text-gray-300 mb-6">
            Some cookies on our website are set by third-party services that we use to enhance 
            your experience. These services have their own privacy policies and cookie practices.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Analytics Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Google Analytics - Website usage analytics</li>
                <li>• Hotjar - User behavior analysis</li>
                <li>• Mixpanel - Event tracking and analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">External Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Stripe - Payment processing</li>
                <li>• Intercom - Customer support chat</li>
                <li>• Social media embeds</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
            <p className="text-orange-200 text-sm">
              <strong>Note:</strong> You can also manage cookies through your browser settings. 
              Most browsers allow you to block or delete cookies, but this may affect website functionality.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Browser Settings */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Browser Cookie Settings</h2>
          <p className="text-gray-300 mb-6">
            You can also control cookies through your browser settings. Here's how to manage 
            cookies in popular browsers:
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Chrome</h3>
              <p className="text-sm text-gray-400">Settings → Privacy and security → Cookies</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Firefox</h3>
              <p className="text-sm text-gray-400">Options → Privacy & Security → Cookies</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Safari</h3>
              <p className="text-sm text-gray-400">Preferences → Privacy → Cookies</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Edge</h3>
              <p className="text-sm text-gray-400">Settings → Cookies and site permissions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact Information */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Questions About Cookies?</h3>
          <p className="text-gray-300 text-sm mb-4">
            If you have any questions about our use of cookies or need help managing your preferences, 
            please don&apos;t hesitate to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Contact Support
              </motion.button>
            </Link>
            <Link href="/privacy">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-orange-400 text-orange-400 px-6 py-2 rounded-lg font-semibold hover:bg-orange-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}