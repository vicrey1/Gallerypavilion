import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'photographer' | 'client' | 'admin'
  name?: string
  photographerId?: string
  clientId?: string
  inviteCode?: string
  permissions?: {
    canView: boolean
    canFavorite: boolean
    canComment: boolean
    canDownload: boolean
    canRequestPurchase: boolean
  }
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  try {
    // Debug: print whether authorization header and cookie are present (do NOT log token contents)
    const hasAuthHeader = !!authHeader
    // Prefer our auth cookie but fall back to Vercel's `_vercel_jwt` if present
    const tokenCookie = request.cookies.get('auth-token')
    const vercelJwtCookie = request.cookies.get('_vercel_jwt')
    const hasCookie = !!tokenCookie || !!vercelJwtCookie
    // Also log cookie header keys length (not values) to help diagnose production reverse-proxy cookie stripping
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieNames = cookieHeader
      .split(';')
      .map(c => c.split('=')[0].trim())
      .filter(Boolean)
    // Use console.debug so logs are visible during local dev without exposing secrets
    // Also indicate whether `_vercel_jwt` was present (but never log token contents)
    console.debug('[jwt] getTokenFromRequest - hasAuthHeader:', hasAuthHeader, 'hasCookie:', hasCookie, 'has_vercel_jwt:', !!vercelJwtCookie, 'cookieNames:', cookieNames)
  } catch (e) {
    // Swallow any cookie-access errors in edge environments
    console.debug('[jwt] getTokenFromRequest - cookie check failed')
  }
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try to get token from cookie
  // Prefer our auth-token, otherwise try Vercel's `_vercel_jwt`.
  const tokenCookiePrimary = request.cookies.get('auth-token')
  if (tokenCookiePrimary) {
    return tokenCookiePrimary.value
  }

  const tokenCookieVercel = request.cookies.get('_vercel_jwt')
  if (tokenCookieVercel) {
    // WARNING: `_vercel_jwt` may be signed by Vercel. We attempt to verify it as a JWT here.
    // If you rely on Vercel's JWT feature, ensure the signing secret is compatible with `JWT_SECRET`.
    return tokenCookieVercel.value
  }

  return null
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  return verifyToken(token)
}