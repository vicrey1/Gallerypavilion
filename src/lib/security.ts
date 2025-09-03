import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

// AWS S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

/**
 * Generate a signed URL for secure image access
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise<string> - Signed URL
 */
export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    })

    return signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate secure URL')
  }
}

/**
 * Generate a watermarked image URL
 * @param originalKey - Original image S3 key
 * @param watermarkText - Text to overlay (photographer name/logo)
 * @returns string - Watermarked image URL
 */
export function generateWatermarkedUrl(
  originalKey: string,
  watermarkText: string
): string {
  // In a real implementation, this would integrate with an image processing service
  // like AWS Lambda + Sharp, Cloudinary, or ImageKit
  const baseUrl = process.env.APP_URL || 'http://localhost:3001'
  const encodedKey = encodeURIComponent(originalKey)
  const encodedWatermark = encodeURIComponent(watermarkText)
  
  return `${baseUrl}/api/images/watermark?key=${encodedKey}&text=${encodedWatermark}`
}

/**
 * Generate a secure token for image access
 * @param photoId - Photo ID
 * @param clientId - Client ID
 * @param expiresAt - Token expiration timestamp
 * @returns string - Secure access token
 */
export function generateImageAccessToken(
  photoId: string,
  clientId: string,
  expiresAt: number
): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
  const payload = `${photoId}:${clientId}:${expiresAt}`
  
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const signature = hmac.digest('hex')
  
  return `${Buffer.from(payload).toString('base64')}.${signature}`
}

/**
 * Verify an image access token
 * @param token - Access token to verify
 * @param photoId - Expected photo ID
 * @param clientId - Expected client ID
 * @returns boolean - Token validity
 */
export function verifyImageAccessToken(
  token: string,
  photoId: string,
  clientId: string
): boolean {
  try {
    const [payloadBase64, signature] = token.split('.')
    if (!payloadBase64 || !signature) return false
    
    const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    const [tokenPhotoId, tokenClientId, expiresAtStr] = payload.split(':')
    
    // Check if token matches expected values
    if (tokenPhotoId !== photoId || tokenClientId !== clientId) {
      return false
    }
    
    // Check if token has expired
    const expiresAt = parseInt(expiresAtStr, 10)
    if (Date.now() > expiresAt) {
      return false
    }
    
    // Verify signature
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying image access token:', error)
    return false
  }
}

/**
 * Log security events for audit purposes
 * @param event - Security event type
 * @param details - Event details
 */
export function logSecurityEvent(
  event: 'unauthorized_access' | 'token_expired' | 'invalid_invite' | 'gallery_access',
  details: Record<string, string | number | boolean | null>
): void {
  // In production, this would integrate with a logging service
  // like AWS CloudWatch, DataDog, or a custom audit log
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

/**
 * Rate limiting for API endpoints
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns boolean - Whether request is allowed
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const key = identifier
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up rate limit store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}