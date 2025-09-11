'use client'

import { motion } from 'framer-motion'
import { Scale, FileText, Shield, AlertTriangle, Users, Globe } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: FileText,
      content: [
        'By accessing and using Gallery Pavilion, you accept and agree to be bound by these Terms of Service',
        'If you do not agree to these terms, you may not use our service',
        'We may update these terms at any time, and continued use constitutes acceptance of changes',
        'You must be at least 18 years old or have parental consent to use our service'
      ]
    },
    {
      id: 'service-description',
      title: 'Service Description',
      icon: Globe,
      content: [
        'Gallery Pavilion provides online photo gallery hosting and management services',
        'We offer various subscription plans with different storage and feature limits',
        'Service availability may vary by geographic location',
        'We reserve the right to modify or discontinue features with reasonable notice'
      ]
    },
    {
      id: 'user-accounts',
      title: 'User Accounts and Responsibilities',
      icon: Users,
      content: [
        'You are responsible for maintaining the confidentiality of your account credentials',
        'You must provide accurate and complete information when creating an account',
        'You are solely responsible for all activities that occur under your account',
        'You must notify us immediately of any unauthorized use of your account',
        'One person or entity may not maintain more than one free account'
      ]
    },
    {
      id: 'content-ownership',
      title: 'Content Ownership and Rights',
      icon: Shield,
      content: [
        'You retain full ownership of all photos and content you upload to our platform',
        'You grant us a limited license to store, display, and transmit your content as necessary to provide our services',
        'You are responsible for ensuring you have the right to upload and share all content',
        'We do not claim ownership of your content and will not use it for commercial purposes without your consent',
        'You may delete your content at any time, and we will remove it from our servers within 30 days'
      ]
    },
    {
      id: 'prohibited-uses',
      title: 'Prohibited Uses',
      icon: AlertTriangle,
      content: [
        'Uploading illegal, harmful, threatening, abusive, or defamatory content',
        'Violating any intellectual property rights of others',
        'Attempting to gain unauthorized access to our systems or other user accounts',
        'Using our service to distribute spam, malware, or other malicious content',
        'Engaging in any activity that could damage, disable, or impair our service',
        'Using automated systems to access our service without permission'
      ]
    },
    {
      id: 'payment-terms',
      title: 'Payment and Billing',
      icon: Scale,
      content: [
        'Subscription fees are billed in advance on a monthly or annual basis',
        'All fees are non-refundable except as required by law',
        'We may change our pricing with 30 days notice to existing subscribers',
        'Failure to pay may result in suspension or termination of your account',
        'You are responsible for all taxes associated with your use of our service'
      ]
    }
  ]

  const lastUpdated = 'December 15, 2024'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/20 to-purple-800/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center">
                <Scale className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Terms of
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Service</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Please read these terms carefully before using our photo gallery platform.
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
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Gallery Pavilion</h2>
          <p className="text-gray-300 mb-4">
            These Terms of Service ("Terms") govern your use of the Gallery Pavilion website and services 
             operated by Gallery Pavilion Inc. ("us", "we", or "our"). These Terms apply to all visitors, 
            users, and others who access or use our service.
          </p>
          <p className="text-gray-300">
            By accessing or using our service, you agree to be bound by these Terms. If you disagree 
            with any part of these terms, then you may not access the service.
          </p>
        </motion.div>
      </div>

      {/* Terms Sections */}
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
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Service Availability */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Service Availability and Limitations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Service Uptime</h3>
              <p className="text-gray-300 mb-4">
                We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. 
                Scheduled maintenance will be announced in advance when possible.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Regular maintenance windows</li>
                <li>• Emergency maintenance as needed</li>
                <li>• Third-party service dependencies</li>
                <li>• Force majeure events</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Storage Limits</h3>
              <p className="text-gray-300 mb-4">
                Storage limits vary by subscription plan. Exceeding limits may result in 
                service restrictions until additional storage is purchased.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Free plan: 1GB storage</li>
                <li>• Pro plan: 100GB storage</li>
                <li>• Business plan: 1TB storage</li>
                <li>• Enterprise: Custom limits</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Termination */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Account Termination</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Termination by You</h3>
              <p className="text-gray-300 mb-4">
                You may terminate your account at any time through your account settings or by contacting support.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Download your data before termination</li>
                <li>• Cancellation takes effect at the end of billing period</li>
                <li>• No refunds for partial periods</li>
                <li>• Data deletion within 30 days</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Termination by Us</h3>
              <p className="text-gray-300 mb-4">
                We may terminate accounts for violations of these terms, non-payment, or other legitimate reasons.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Violation of terms of service</li>
                <li>• Non-payment of fees</li>
                <li>• Illegal or harmful content</li>
                <li>• Abuse of service resources</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Liability and Disclaimers */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Limitation of Liability</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Service Disclaimer</h3>
              <p className="text-gray-300">
                Our service is provided "as is" without warranties of any kind. We do not guarantee 
                that the service will be uninterrupted, secure, or error-free. You use the service 
                at your own risk.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Limitation of Damages</h3>
              <p className="text-gray-300">
                In no event shall Gallery Pavilion be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including loss of profits, data, or other 
                intangible losses resulting from your use of the service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Maximum Liability</h3>
              <p className="text-gray-300">
                Our total liability to you for any claims arising from these terms or your use 
                of the service shall not exceed the amount you paid us in the 12 months preceding 
                the claim, or $100, whichever is greater.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Governing Law */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Governing Law and Disputes</h2>
          <p className="text-gray-300 mb-6">
            These Terms shall be governed by and construed in accordance with the laws of the 
            State of California, without regard to its conflict of law provisions. Any disputes 
            arising from these Terms or your use of the service shall be resolved through binding 
            arbitration in accordance with the rules of the American Arbitration Association.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Dispute Resolution</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Informal resolution attempts first</li>
                <li>• Binding arbitration if needed</li>
                <li>• Individual claims only (no class actions)</li>
                <li>• California state law applies</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Severability</h3>
              <p className="text-sm text-gray-400">
                If any provision of these Terms is found to be unenforceable, 
                the remaining provisions will remain in full force and effect.
              </p>
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Questions About These Terms?</h2>
          <p className="text-blue-100 mb-6">
            If you have any questions about these Terms of Service, please contact our legal team. 
            We're here to help clarify any concerns you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </motion.button>
            </Link>
            <a href="mailto:legal@gallerypavilion.com">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Email Legal Team
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
          <h3 className="text-lg font-semibold text-white mb-2">Terms Updates</h3>
          <p className="text-gray-300 text-sm">
            We reserve the right to modify these Terms at any time. We will notify users of 
            material changes via email or through our service. Continued use of the service 
            after changes constitutes acceptance of the new Terms.
          </p>
        </motion.div>
      </div>
    </div>
  )
}