'use client'

import { useState, Suspense } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { signIn, getProviders } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, Mail, Key, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function SignInContent() {
  const [activeTab, setActiveTab] = useState<'photographer' | 'client'>('photographer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handlePhotographerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('photographer-login', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'Account pending approval') {
          setError('Your account is pending admin approval. Please wait for approval before logging in.')
        } else {
          setError('Invalid email or password')
        }
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('invite-code', {
        inviteCode,
        email: clientEmail,
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Failed to send magic link')
      } else {
        setError('')
        // Show success message
        alert('Check your email for the magic link!')
      }
    } catch (error) {
      setError('An error occurred sending the magic link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/hero-bg.svg')] opacity-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-300">Access your private gallery</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('photographer')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'photographer'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Photographer
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'client'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Client
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Photographer Login */}
          {activeTab === 'photographer' && (
            <div className="space-y-6">
              <form onSubmit={handlePhotographerLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="photographer@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b border-white mr-2" style={{borderBottomWidth: '2px'}} />
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Sign In with Password
                    </div>
                  )}
                </motion.button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-gray-400">or</span>
                </div>
              </div>

              <motion.button
                onClick={handleEmailSignIn}
                disabled={isLoading || !email}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-4 rounded-lg font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Magic Link
              </motion.button>

              <div className="text-center">
                <Link
                  href="/auth/photographer-signup"
                  className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                >
                  Don&apos;t have an account? Register here
                </Link>
              </div>
            </div>
          )}

          {/* Client Login */}
          {activeTab === 'client' && (
            <form onSubmit={handleClientLogin} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Invite Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter your invite code"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b border-white mr-2" style={{borderBottomWidth: '2px'}} />
                    Accessing Gallery...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Access Gallery
                  </div>
                )}
              </motion.button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  )
}