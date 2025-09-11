'use client'

import { motion } from 'framer-motion'
import { Camera, ArrowLeft, Shield, Key, Mail, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [inviteType, setInviteType] = useState<'code' | 'email'>('code')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)
    console.log('Submitting invite validation for:', inviteType === 'code' ? inviteCode : email)

    try {
      // Normalize invite code client-side: trim, remove spaces, lowercase
      const normalizedCode = inviteType === 'code'
        ? inviteCode.trim().replace(/\s+/g, '').toLowerCase()
        : undefined

      // Normalize email client-side as well
      const normalizedEmail = inviteType === 'email' ? email.trim().toLowerCase() : undefined

      console.log('Making validation request with:', { normalizedCode, normalizedEmail })

      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: normalizedCode,
          email: normalizedEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed')
      }

      if (data.success) {
        console.log('Validation successful:', data)

        // Store gallery data in sessionStorage for the gallery page
        const galleryData = {
          gallery: data.gallery,
          permissions: data.permissions,
          invite: data.invite
        }
        sessionStorage.setItem('inviteGalleryData', JSON.stringify(galleryData))
        console.log('Stored gallery data in sessionStorage:', galleryData)

        // Always redirect to the invited access gallery view, passing invite code
        const redirectUrl = `/gallery/${data.gallery.id}/invite?code=${encodeURIComponent(data.invite.inviteCode)}`
        console.log('Redirecting to:', redirectUrl)
        await router.push(redirectUrl)
      } else {
        throw new Error('Invalid invite code or email')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsValidating(false)
    }
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
      <div className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Access Your Private Gallery
            </h1>
            <p className="text-xl text-gray-300">
              Enter your invitation code or email to view your exclusive photography collection.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            {/* Toggle Buttons */}
            <div className="flex bg-white/5 rounded-lg p-1 mb-8">
              <button
                onClick={() => setInviteType('code')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  inviteType === 'code'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Invite Code</span>
              </button>
              <button
                onClick={() => setInviteType('email')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  inviteType === 'email'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Email Access</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {inviteType === 'code' ? (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Invitation Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter your invite code"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    maxLength={20}
                    required
                  />
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    Enter the complete invite code provided by your photographer
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the email address you were invited with"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Use the same email address that received the invitation
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isValidating || (inviteType === 'code' ? !inviteCode : !email)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b border-white" style={{borderBottomWidth: '2px'}}></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Access Gallery</span>
                  </>
                )}
              </button>
            </form>

            {/* Help Section */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Need Help?
              </h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <p>
                  <strong>Can&apos;t find your invite code?</strong> Check your email for the invitation message from your photographer.
                </p>
                <p>
                  <strong>Code not working?</strong> Make sure you&apos;re entering the complete code exactly as provided. Check for any extra spaces or missing characters.
                </p>
                <p>
                  <strong>Email access issues?</strong> Ensure you&apos;re using the exact email address that received the invitation.
                </p>
                <p>
                  <strong>Still having trouble?</strong> Contact your photographer directly for assistance.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Your Privacy is Protected</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  This gallery is completely private and secure. Only invited guests can access the content, 
                  and all images are watermarked for protection. Your viewing activity is logged for security purposes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/5 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}