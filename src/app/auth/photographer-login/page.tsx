'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function PhotographerLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Attempting login with:', formData.email)
      const result = await signIn('photographer-login', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })
      
      console.log('Login result:', result)

      if (!result?.ok) {
        // Show specific error messages based on error type
        if (result?.error === 'Account pending approval') {
          setError('Your account is pending approval. Please wait for admin approval or contact support.')
        } else if (result?.error === 'User is not a photographer') {
          setError('This account is not registered as a photographer. Please sign up as a photographer first.')
        } else if (result?.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(result?.error || 'An error occurred during login. Please try again.')
        }
        return
      }

      // Successfully logged in
      setError('')
      setSuccess('Successfully logged in! Redirecting to dashboard...')
      
      // Use router to redirect
      router.push('/dashboard')
    } catch (error) {
      setError('An error occurred during login')
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
            <h1 className="text-3xl font-bold text-white mb-2">Photographer Login</h1>
            <p className="text-gray-300">Access your photography dashboard</p>
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

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-green-200 text-sm">{success}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
                  <Lock className="h-5 w-5 mr-2" />
                  Sign In
                </div>
              )}
            </motion.button>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="text-gray-400 text-sm">
              Don&apos;t have an account?
            </div>
            <Link
              href="/auth/photographer-signup"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Camera className="h-4 w-4 mr-2" />
              Register as Photographer
            </Link>
            
            <div className="pt-4 border-t border-white/10">
              <Link
                href="/"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}