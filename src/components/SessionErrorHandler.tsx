'use client'

import { useEffect } from 'react'

interface SessionErrorHandlerProps {
  hasSessionError: boolean
}

export default function SessionErrorHandler({ hasSessionError }: SessionErrorHandlerProps) {
  useEffect(() => {
    if (hasSessionError) {
      // Clear our JWT cookie used for auth
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

      // Fallback: also clear any lingering NextAuth cookies if present
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

      console.log('Cleared auth-token and any lingering NextAuth cookies due to session error')
    }
  }, [hasSessionError])

  return null
}