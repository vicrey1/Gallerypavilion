'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // If user is logged in, redirect based on their role
      switch (session.user.role) {
        case 'admin':
          router.replace('/admin')
          break
        case 'photographer':
          router.replace('/dashboard')
          break
        case 'client':
          router.replace('/client')
          break
      }
    }
  }, [session, status, router])

  // Only show the children (auth pages) if user is not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
