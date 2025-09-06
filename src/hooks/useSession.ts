'use client'

import { useEffect, useState } from 'react'
import { Session } from 'next-auth'

interface UseSessionReturn {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: () => Promise<void>
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const fetchSession = async () => {
    try {
      setStatus('loading')
      const response = await fetch('/api/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const sessionData = await response.json()
        setSession(sessionData)
        setStatus(sessionData ? 'authenticated' : 'unauthenticated')
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Session fetch error:', error)
      setSession(null)
      setStatus('unauthenticated')
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  const update = async () => {
    await fetchSession()
  }

  return {
    data: session,
    status,
    update,
  }
}