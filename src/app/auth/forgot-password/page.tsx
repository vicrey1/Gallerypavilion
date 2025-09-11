'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
  const { data: session } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Redirect if user is logged in
  if (session) {
    const redirectUrl = session.user.role === 'admin' ? '/admin' : '/dashboard'
    router.replace(redirectUrl)
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <Mail className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-300">
              If an account exists with the email address {email}, you will receive password reset instructions.
            </p>
          </div>
          <Link
            href="/auth/photographer-login"
            className="flex items-center justify-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-300">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
          </motion.button>

          <Link
            href="/auth/photographer-login"
            className="flex items-center justify-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </form>
      </motion.div>
    </div>
  )
}
