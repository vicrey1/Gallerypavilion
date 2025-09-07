import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { generateInviteCode } from './utils'

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

const isHttps = (process.env.NEXTAUTH_URL || '').startsWith('https://')

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  useSecureCookies: isHttps,
  providers: [
    // Credentials provider for photographer authentication
    CredentialsProvider({
      id: 'photographer-login',
      name: 'Photographer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 [PHOTOGRAPHER-LOGIN] Starting authentication...')
        console.log('📧 Email:', credentials?.email)
        console.log('🔑 Password provided:', !!credentials?.password)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [PHOTOGRAPHER-LOGIN] Missing credentials')
          throw new Error('Email and password are required')
        }

        try {
          console.log('🔍 [PHOTOGRAPHER-LOGIN] Searching for user in database...')
          // Find the user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              photographer: true
            }
          })

          console.log('👤 [PHOTOGRAPHER-LOGIN] User found:', {
            exists: !!user,
            email: user?.email,
            role: user?.role,
            hasPassword: !!user?.password,
            hasPhotographerRecord: !!user?.photographer,
            photographerStatus: user?.photographer?.status
          })

          if (!user || !user.password) {
            console.log('❌ [PHOTOGRAPHER-LOGIN] User not found or no password')
            throw new Error('Invalid email or password')
          }

          console.log('🔐 [PHOTOGRAPHER-LOGIN] Verifying password...')
          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          console.log('🔐 [PHOTOGRAPHER-LOGIN] Password valid:', isValidPassword)
          
          if (!isValidPassword) {
            console.log('❌ [PHOTOGRAPHER-LOGIN] Invalid password')
            throw new Error('Invalid email or password')
          }

          // Check if user is a photographer
          if (!user.photographer) {
            console.log('❌ [PHOTOGRAPHER-LOGIN] User has no photographer record')
            console.log('📊 [PHOTOGRAPHER-LOGIN] User details:', {
              id: user.id,
              email: user.email,
              role: user.role
            })
            throw new Error('User is not a photographer')
          }

          // Check photographer approval status
          if (user.photographer.status !== 'approved') {
            console.log('❌ [PHOTOGRAPHER-LOGIN] Photographer not approved, status:', user.photographer.status)
            throw new Error('Account pending approval')
          }

          console.log('✅ [PHOTOGRAPHER-LOGIN] Authentication successful!')
          const authResult = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role as 'photographer' | 'client' | 'admin',
            photographerId: user.photographer.id,
            photographerStatus: user.photographer.status
          }
          console.log('📤 [PHOTOGRAPHER-LOGIN] Returning user:', authResult)
          
          return authResult
        } catch (error) {
          console.error('💥 [PHOTOGRAPHER-LOGIN] Authentication error:', error instanceof Error ? error.message : String(error))
          console.error('💥 [PHOTOGRAPHER-LOGIN] Full error:', error)
          throw error
        }
      }
    }),
    
    // Credentials provider for invite-based client access
    CredentialsProvider({
      id: 'invite-code',
      name: 'Invite Code',
      credentials: {
        inviteCode: { label: 'Invite Code', type: 'text' },
        email: { label: 'Email (optional)', type: 'email' }
      },
      async authorize(credentials) {
        if (!credentials?.inviteCode) {
          throw new Error('Invite code is required')
        }

        try {
          // Find the invite in the database
          const invite = await prisma.invite.findUnique({
            where: { inviteCode: credentials.inviteCode },
            include: {
              gallery: {
                include: {
                  photographer: true
                }
              }
            }
          })

          if (!invite) {
            throw new Error('Invalid invite code')
          }

          // Check if invite is still valid
          if (invite.status !== 'active') {
            throw new Error('Invite is no longer active')
          }

          // Check if invite has expired
          if (invite.expiresAt && new Date() > invite.expiresAt) {
            // Update invite status to expired
            await prisma.invite.update({
              where: { id: invite.id },
              data: { status: 'expired' }
            })
            throw new Error('Invite has expired')
          }

          // Check usage limits for multi-use invites
          if (invite.maxUsage && invite.usageCount >= invite.maxUsage) {
            throw new Error('Invite usage limit reached')
          }

          // If email is provided, validate it matches the invite
          if (credentials.email && invite.clientEmail && 
              credentials.email.toLowerCase() !== invite.clientEmail.toLowerCase()) {
            throw new Error('Email does not match invite')
          }

          // Create or find client user
          const clientEmail = credentials.email || invite.clientEmail || `client-${invite.inviteCode}@temp.local`
          
          let client = await prisma.client.findUnique({
            where: { email: clientEmail }
          })

          if (!client) {
            // First create a User record
            const user = await prisma.user.create({
              data: {
                email: clientEmail,
                name: credentials.email ? credentials.email.split('@')[0] : `Client ${invite.inviteCode}`,
                role: 'client'
              }
            })
            
            // Then create the Client record
            client = await prisma.client.create({
              data: {
                userId: user.id,
                email: clientEmail,
                name: credentials.email ? credentials.email.split('@')[0] : `Client ${invite.inviteCode}`,
                invitedBy: invite.gallery.photographerId
              }
            })
          }

          // Update invite usage for single-use invites
          if (invite.type === 'single_use') {
            await prisma.invite.update({
              where: { id: invite.id },
              data: { 
                status: 'used',
                usageCount: { increment: 1 },
                usedAt: new Date()
              }
            })
          } else {
            // Increment usage count for multi-use invites
            await prisma.invite.update({
              where: { id: invite.id },
              data: { 
                usageCount: { increment: 1 },
                usedAt: new Date()
              }
            })
          }

          // Return user object for session
          return {
            id: client.id,
            email: client.email,
            name: client.name ?? undefined,
            role: 'client' as const,
            photographerId: invite.gallery.photographerId,
            inviteCode: invite.inviteCode,
            permissions: {
              canView: invite.canView,
              canFavorite: invite.canFavorite,
              canComment: invite.canComment,
              canDownload: invite.canDownload,
              canRequestPurchase: invite.canRequestPurchase
            }
          }
        } catch (error) {
          console.error('Invite authentication error:', error)
          throw error
        }
      }
    }),

    // Credentials provider for admin login
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find the user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          })

          if (!user || !user.password) {
            throw new Error('Invalid email or password')
          }

          // Check if user has admin role
          if (user.role !== 'admin') {
            throw new Error('Access denied - Admin privileges required')
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          if (!isValidPassword) {
            throw new Error('Invalid email or password')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? 'System Administrator',
            role: 'admin' as const
          }
        } catch (error) {
          console.error('Admin authentication error:', error)
          throw error
        }
      }
    })
  ],
  
  cookies: {
    sessionToken: {
      name: isHttps ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isHttps,
      }
    },
    csrfToken: {
      name: isHttps ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        // Must NOT be HttpOnly so the client can read and send it back for CSRF verification
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: isHttps,
      }
    },
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days for better security
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  
  callbacks: {
    async signIn({ user }) {
      // Always allow sign-in if authorize returned a valid user
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.photographerId = (user as any).photographerId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role as any
        ;(session.user as any).photographerId = token.photographerId as any
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Enforce www canonical base url in production for cookie consistency
      const prodBase = 'https://www.gallerypavilion.com'
      if (process.env.NODE_ENV === 'production') {
        if (url.startsWith('/')) return `${prodBase}${url}`
        if (url.startsWith(baseUrl)) return url
        // Allow callbackUrl to dashboard
        return prodBase
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
  
  events: {
    async signIn({ user, profile }) {
      // Log sign in events for security
      console.log(`User signed in: ${user.email} (${user.role})`)
      
      // Track client access for analytics
      if (user.role === 'client' && user.inviteCode) {
        try {
          await prisma.analytics.create({
            data: {
              type: 'gallery_access',
              clientId: user.id,
              inviteCode: user.inviteCode,
              metadata: {
                userAgent: 'unknown',
                timestamp: new Date().toISOString()
              }
            }
          })
        } catch (error) {
          console.error('Failed to log analytics:', error)
        }
      }
    },
    
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`)
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
}

// Helper functions for authentication
export async function validateInviteCode(inviteCode: string): Promise<boolean> {
  try {
    const invite = await prisma.invite.findUnique({
      where: { inviteCode }
    })
    
    if (!invite || invite.status !== 'active') {
      return false
    }
    
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return false
    }
    
    if (invite.maxUsage && invite.usageCount >= invite.maxUsage) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating invite code:', error)
    return false
  }
}

export async function createInvite(data: {
  galleryId: string
  type: 'single_use' | 'multi_use' | 'time_limited'
  clientEmail?: string
  expiresAt?: Date
  maxUsage?: number
  permissions: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
}) {
  try {
    const inviteCode = generateInviteCode()
    
    const invite = await prisma.invite.create({
      data: {
        inviteCode,
        galleryId: data.galleryId,
        type: data.type,
        clientEmail: data.clientEmail,
        expiresAt: data.expiresAt,
        maxUsage: data.maxUsage,
        status: 'active',
        canView: data.permissions.canView,
        canFavorite: data.permissions.canFavorite,
        canComment: data.permissions.canComment,
        canDownload: data.permissions.canDownload,
        canRequestPurchase: data.permissions.canRequestPurchase,
        usageCount: 0
      }
    })
    
    return invite
  } catch (error) {
    console.error('Error creating invite:', error)
    throw error
  }
}

export async function revokeInvite(inviteId: string) {
  try {
    const invite = await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'revoked' }
    })
    
    return invite
  } catch (error) {
    console.error('Error revoking invite:', error)
    throw error
  }
}

export async function getInvitesByGallery(galleryId: string) {
  try {
    const invites = await prisma.invite.findMany({
      where: { galleryId },
      orderBy: { createdAt: 'desc' }
    })
    
    return invites
  } catch (error) {
    console.error('Error fetching invites:', error)
    throw error
  }
}

export async function getPhotographerGalleries(photographerId: string) {
  try {
    const galleries = await prisma.gallery.findMany({
      where: { photographerId },
      include: {
        collections: {
          include: {
            photos: true
          }
        },
        invites: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return galleries
  } catch (error) {
    console.error('Error fetching photographer galleries:', error)
    throw error
  }
}

export async function getClientAccessibleGalleries(clientId: string) {
  try {
    // Get all invites for this client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        clientInvites: {
          where: {
            invite: {
              status: 'active',
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          },
          include: {
            invite: {
              include: {
                gallery: {
                  include: {
                    collections: {
                      include: {
                        photos: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    return client?.clientInvites.map(clientInvite => clientInvite.invite.gallery) || []
  } catch (error) {
    console.error('Error fetching client galleries:', error)
    throw error
  }
}