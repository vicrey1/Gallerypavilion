import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'

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
    // Log structured verification failure info to help debug production 401s.
    try {
      const errName = error && (error as Error).name ? (error as Error).name : 'UnknownError'
      const errMsg = error && (error as Error).message ? (error as Error).message : String(error)
      // Attempt to decode header (no verification) to surface alg/kid for debugging
      const decodedComplete = jwt.decode(token, { complete: true }) as { header?: Record<string, unknown>; payload?: Record<string, unknown> } | null
      const headerInfo = decodedComplete?.header ? { alg: decodedComplete.header['alg'], kid: decodedComplete.header['kid'] } : null
      console.error('[jwt] verifyToken failed', { name: errName, message: errMsg, header: headerInfo })
    } catch (logError) {
      console.error('[jwt] verifyToken failed and additional logging failed', error)
    }
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
  // Do NOT return `_vercel_jwt` here — prefer our own `auth-token` cookie.
  // `_vercel_jwt` may be signed by Vercel and won't verify with our JWT_SECRET.
  // The async helper `getUserFromRequestAsync` will attempt to map `_vercel_jwt` safely if needed.

  // Fallback: some runtime environments may not populate request.cookies as expected.
  // As a last resort, parse the Cookie header manually for `auth-token` or `_vercel_jwt`.
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    if (cookieHeader) {
      // Simple parse: look for key=value pairs separated by ';'
      const cookies = cookieHeader.split(';').map(c => c.trim())
      for (const c of cookies) {
        if (c.startsWith('auth-token=')) {
          // Do not log token contents; return value only
          return c.substring('auth-token='.length)
        }
        // If only _vercel_jwt is present, we don't return it here — let async fallback map it.
      }
    }
  } catch (e) {
    console.debug('[jwt] manual cookie header parse failed', e)
  }

  return null
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  // Synchronous path: only verify the token with our JWT_SECRET.
  // This avoids DB access and keeps middleware and other sync callers working.
  return verifyToken(token)
}

// Async helper: when verification fails (for example when Vercel injects `_vercel_jwt`),
// attempt to decode the token and map it to a local user record via Prisma.
export async function getUserFromRequestAsync(request: NextRequest): Promise<JWTPayload | null> {
  // Try to get an auth token (our auth-token or Bearer header)
  let token = getTokenFromRequest(request)

  // If we have a token, try to verify it first
  if (token) {
    const verified = verifyToken(token)
    if (verified) return verified
    // If verification failed, fall through to attempt mapping via decoded token
  } else {
    // No auth-token; attempt to read Vercel's injected cookie
    const vercelCookie = request.cookies.get('_vercel_jwt')
    if (!vercelCookie) return null
    token = vercelCookie.value
  }

  // At this point we have a token (either original or _vercel_jwt). Attempt to decode and map to local user.
  try {
    const decoded = jwt.decode(token) as Record<string, unknown> | null
    if (decoded) {
      // Attempt to find an email anywhere in the decoded token payload.
      // Vercel / other identity providers sometimes use nested claim names.
      const isEmail = (s: unknown) => typeof s === 'string' && /@/.test(s)

      function findEmailInObject(obj: unknown): string | undefined {
        if (!obj) return undefined
        if (typeof obj === 'string') {
          return isEmail(obj) ? obj : undefined
        }
        if (Array.isArray(obj)) {
          for (const v of obj) {
            const found = findEmailInObject(v)
            if (found) return found
          }
          return undefined
        }
        if (typeof obj === 'object') {
          for (const [_k, v] of Object.entries(obj as Record<string, unknown>)) {
            const found = findEmailInObject(v)
            if (found) return found
          }
          return undefined
        }
        return undefined
      }

      const claimKeys = Object.keys(decoded)
      const emailCandidate = (decoded['email'] || decoded['email_address'] || decoded['sub'] || decoded['userId']) as string | undefined || findEmailInObject(decoded)
      if (emailCandidate) {
        const normalizedEmail = String(emailCandidate).toLowerCase()
        console.debug('[jwt] decoded claim keys:', claimKeys, 'foundEmailCandidate:', normalizedEmail)
        const user = await withPrismaRetry(() =>
          prisma.user.findUnique({ where: { email: normalizedEmail }, include: { photographer: true, client: true } })
        )
        if (user) {
          const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role as 'photographer' | 'client' | 'admin',
            name: user.name || undefined,
            photographerId: user.photographer?.id || undefined,
            clientId: user.client?.id || undefined,
            permissions: {
              canView: true,
              canFavorite: true,
              canComment: true,
              canDownload: user.role === 'photographer' || user.role === 'admin',
              canRequestPurchase: true
            }
          }
          console.debug('[jwt] Mapped token to local user:', { email: normalizedEmail, id: user.id })
          return payload
        }
      }
    }
  } catch (e) {
    console.debug('[jwt] fallback mapping from decoded token failed', e)
  }

  return null
}