'use client'

import { useEffect } from 'react'

interface SessionErrorHandlerProps {
  hasSessionError: boolean
}

export default function SessionErrorHandler({ hasSessionError }: SessionErrorHandlerProps) {
  useEffect(() => {
    if (hasSessionError) {
      // Call logout endpoint to clear the server-side cookie consistently
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
        console.log('Triggered logout due to session error')
      })
    }
  }, [hasSessionError])

  return null
}