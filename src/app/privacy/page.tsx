'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Database, Users, Globe } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: Database,
      content: [
        'Account information (name, email, billing details)',
        'Photos and media files you upload to our platform',
        'Usage data and analytics to improve our services',
        'Device and browser information for security purposes',
        'Communication records when you contact support'
      ]
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: Users,
      content: [
        'Provide and maintain our photo gallery services',
        'Process payments and manage your account',
        'Send important updates about your account or service',
        'Improve our platform based on usage patterns',
        'Provide customer support and respond to inquiries'
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: Globe,
      content: [
        'We never sell your personal information to third parties',
        'Photos are only shared with people you explicitly grant access to',
        'We may share data with service providers who help us operate our platform',
        'Legal compliance: We may disclose information if required by law',
        'Business transfers: Information may be transferred if we are acquired'
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: Shield,
      content: [
        'All data is encrypted in transit and at rest using industry-standard encryption',
        'Regular security audits and penetration testing',
        'Secure data centers with 24/7 monitoring',
        'Employee access is strictly limited and monitored',
        'Automatic backups ensure your data is never lost'
      ]
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: Lock,
      content: [
        'Account data is retained while your account is active',
        'Photos and galleries are kept according to your subscription plan',
        'Deleted data is permanently removed within 30 days',
        'Backup copies are securely deleted within 90 days',
        'You can request immediate data deletion by contacting support'
      ]
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      icon: Eye,
      content: [
        'Access: Request a copy of all personal data we have about you',
        'Correction: Update or correct any inaccurate information',
        'Deletion: Request deletion of your personal data',
        'Portability: Export your data in a machine-readable format',
        'Opt-out: Unsubscribe from marketing communications at any time'
      ]
    }
  ]

  const lastUpdated = 'December 15, 2024'

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
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Privacy
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Policy</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Your privacy is our priority. Learn how we collect, use, and protect your personal information.
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
          <h2 className="text-2xl font-bold text-white mb-4">Our Commitment to Your Privacy</h2>
          <p className="text-gray-300 mb-4">
            At Gallery Pavilion, we understand that your photos are precious memories and professional work. 
            We are committed to protecting your privacy and ensuring that your personal information and 
            creative content remain secure and private.
          </p>
          <p className="text-gray-300">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our photo gallery platform. By using our service, you agree to the collection 
            and use of information in accordance with this policy.
          </p>
        </motion.div>
      </div>

      {/* Privacy Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* GDPR & CCPA Compliance */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Regulatory Compliance</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">GDPR Compliance</h3>
              <p className="text-gray-300 mb-4">
                We comply with the General Data Protection Regulation (GDPR) for users in the European Union. 
                You have the right to access, rectify, erase, restrict, and port your personal data.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Right to be informed about data processing</li>
                <li>• Right to access your personal data</li>
                <li>• Right to rectification of inaccurate data</li>
                <li>• Right to erasure ("right to be forgotten")</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">CCPA Compliance</h3>
              <p className="text-gray-300 mb-4">
                We comply with the California Consumer Privacy Act (CCPA) for California residents. 
                You have specific rights regarding your personal information.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Right to know what personal information is collected</li>
                <li>• Right to delete personal information</li>
                <li>• Right to opt-out of the sale of personal information</li>
                <li>• Right to non-discrimination for exercising rights</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cookies */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
          <p className="text-gray-300 mb-6">
            We use cookies and similar tracking technologies to enhance your experience on our platform. 
            These help us remember your preferences, analyze usage patterns, and provide personalized features.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Essential Cookies</h3>
              <p className="text-sm text-gray-400">Required for basic functionality and security</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Analytics Cookies</h3>
              <p className="text-sm text-gray-400">Help us understand how you use our platform</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Preference Cookies</h3>
              <p className="text-sm text-gray-400">Remember your settings and preferences</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link href="/cookies">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-purple-400 text-purple-400 px-6 py-2 rounded-lg font-semibold hover:bg-purple-400 hover:text-white transition-colors"
              >
                Learn More About Cookies
              </motion.button>
            </Link>
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
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Questions About Your Privacy?</h2>
          <p className="text-purple-100 mb-6">
            If you have any questions about this Privacy Policy or how we handle your personal information, 
            please don&apos;t hesitate to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </motion.button>
            </Link>
            <a href="mailto:privacy@gallerypavilion.com">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                Email Privacy Team
              </motion.button>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Updates Notice */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 text-center"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Policy Updates</h3>
          <p className="text-gray-300 text-sm">
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date. 
            We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </motion.div>
      </div>
    </div>
  )
}