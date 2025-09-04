'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'Default':
        return 'An error occurred during authentication.'
      case 'Account pending approval':
        return 'Your photographer account is pending admin approval. Please wait for approval before logging in.'
      case 'User is not a photographer':
        return 'This account is not registered as a photographer. Please sign up as a photographer first.'
      case 'Invalid email or password':
        return 'The email or password you entered is incorrect.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }

  const getErrorTitle = (error: string | null) => {
    switch (error) {
      case 'Account pending approval':
        return 'Account Pending Approval'
      case 'User is not a photographer':
        return 'Account Not Found'
      case 'AccessDenied':
        return 'Access Denied'
      default:
        return 'Authentication Error'
    }
  }

  const getRetryLink = (error: string | null) => {
    switch (error) {
      case 'User is not a photographer':
        return '/auth/photographer-signup'
      case 'Account pending approval':
        return '/contact' // Let them contact support
      default:
        return '/auth/photographer-login'
    }
  }

  const getRetryText = (error: string | null) => {
    switch (error) {
      case 'User is not a photographer':
        return 'Sign Up as Photographer'
      case 'Account pending approval':
        return 'Contact Support'
      default:
        return 'Try Again'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getErrorTitle(error)}
          </h1>
          <p className="text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        {error === 'Account pending approval' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>What happens next?</strong><br />
              An administrator will review your application and approve your account. 
              You'll receive an email notification once your account is approved.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={getRetryLink(error)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {getRetryText(error)}
          </Link>
          
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error code: {error}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}