'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}