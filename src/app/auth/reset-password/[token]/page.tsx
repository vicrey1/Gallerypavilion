'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPassword(props: any) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      body: JSON.stringify({
        token: props?.params?.token,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      // Redirect to login with success message
      router.push('/auth/photographer-login?reset=success')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
          <p className="text-gray-300">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your new password"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Confirm your new password"
              required
              minLength={8}
            />
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
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
