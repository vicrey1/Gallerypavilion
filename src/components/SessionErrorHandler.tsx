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

  console.log('Cleared auth-token due to session error')
    }
  }, [hasSessionError])

  return null
}