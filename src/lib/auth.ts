import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Types for our custom user and session
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string
    role: 'photographer' | 'client' | 'admin'
    photographerId?: string
    inviteCode?: string
    permissions?: {
      canView: boolean
      canFavorite: boolean
      canComment: boolean
      canDownload: boolean
      canRequestPurchase: boolean
    }
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: 'photographer' | 'client' | 'admin'
      photographerId?: string
      inviteCode?: string
      permissions?: {
        canView: boolean
        canFavorite: boolean
        canComment: boolean
        canDownload: boolean
        canRequestPurchase: boolean
      }
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: '/auth/photographer-login', // Default sign-in page
    error: '/auth/error'
  },
  providers: [
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name?: string;
        role: 'photographer' | 'client' | 'admin';
        photographerId?: string;
      } | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing admin credentials')
          return null
        }

        try {
          console.log('Attempting admin login for:', credentials.email)
          
          const user = await prisma.user.findFirst({
            where: { 
              email: credentials.email.toLowerCase(),
              role: 'admin'
            }
          })

          console.log('Admin found:', user ? 'yes' : 'no')

          if (!user || !user.password) {
            console.log('Admin login failed: user not found or no password')
            return null
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          console.log('Admin password valid:', isValidPassword)

          if (!isValidPassword) {
            console.log('Admin login failed: invalid password')
            return null
          }

          const userObject: {
            id: string;
            email: string;
            name?: string;
            role: 'photographer' | 'client' | 'admin';
          } = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role as 'photographer' | 'client' | 'admin'
          }

          console.log('Admin login successful')
          return userObject
        } catch (error) {
          console.error('Admin login error:', error)
          return null
        }
      }
    }),
    CredentialsProvider({
      id: 'photographer-login',
      name: 'Photographer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name?: string;
        role: 'photographer' | 'client' | 'admin';
        photographerId?: string;
      } | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          console.log('Attempting login for email:', credentials.email)
          
          // Find the user by email - case insensitive
          const normalizedEmail = credentials.email.toLowerCase()
          console.log('Searching for email:', normalizedEmail)
          
          const user = await prisma.user.findFirst({
            where: { 
              email: normalizedEmail
            },
            include: {
              photographer: true
            }
          })

          console.log('User found:', user ? 'yes' : 'no')
          console.log('User details:', {
            id: user?.id,
            email: user?.email,
            role: user?.role,
            hasPassword: user?.password ? 'yes' : 'no',
            photographerStatus: user?.photographer?.status
          })

          if (!user || !user.password) {
            console.log('Login failed: user not found or no password set')
            return null
          }

          // Verify password
          console.log('Attempting password verification...')
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          console.log('Password verification result:', isValidPassword)

          if (!isValidPassword) {
            console.log('Login failed: invalid password')
            return null
          }

          // Check if user is a photographer
          if (user.role !== 'photographer') {
            console.log('Login failed: user is not a photographer')
            return null
          }

          // Check photographer record exists
          if (!user.photographer) {
            console.log('Login failed: no photographer profile')
            return null
          }

          // Check photographer approval status
          if (user.photographer.status !== 'approved') {
            console.log('Login failed: account not approved')
            return null
          }

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role as 'photographer' | 'client' | 'admin',
            photographerId: user.photographer.id
          }

          console.log('Login successful, returning user:', userObject)
          return userObject
        } catch (error) {
          console.error('Error in authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as 'photographer' | 'client' | 'admin'
        if ('photographerId' in user) {
          token.photographerId = user.photographerId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'photographer' | 'client' | 'admin'
        if (token.photographerId) {
          session.user.photographerId = token.photographerId as string | undefined
        }
      }
      return session
    }
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
}
