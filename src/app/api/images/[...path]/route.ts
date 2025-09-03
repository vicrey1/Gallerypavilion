import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateSignedUrl, verifyImageAccessToken, logSecurityEvent, checkRateLimit } from '@/lib/security'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const photoId = url.searchParams.get('photoId')
    const token = url.searchParams.get('token')
    const clientIp = request.ip || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(clientIp, 50, 60000)) {
      logSecurityEvent('unauthorized_access', {
        reason: 'rate_limit_exceeded',
        ip: clientIp,
        photoId,
      })
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }

    // Validate required parameters
    if (!photoId) {
      return new NextResponse('Photo ID required', { status: 400 })
    }

    // Get photo details
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        collection: {
          include: {
            gallery: {
              include: {
                photographer: true,
                invites: true,
              },
            },
          },
        },
      },
    })

    if (!photo) {
      logSecurityEvent('unauthorized_access', {
        reason: 'photo_not_found',
        ip: clientIp,
        photoId,
      })
      return new NextResponse('Photo not found', { status: 404 })
    }

    // Check access permissions
    let hasAccess = false
    let isPhotographer = false

    if (session) {
      // Check if user is the photographer who owns this photo
      if (session.user.role === 'photographer' && 
          session.user.photographerId === photo.collection.gallery.photographerId) {
        hasAccess = true
        isPhotographer = true
      }
      
      // Check if user is a client with valid invite
      if (session.user.role === 'client' && session.user.inviteCode) {
        const invite = photo.collection.gallery.invites.find(
          inv => inv.inviteCode === session.user.inviteCode && 
                 inv.status === 'active' &&
                 inv.canView
        )
        
        if (invite) {
          // Check invite expiry
          if (invite.expiresAt && new Date() > invite.expiresAt) {
            logSecurityEvent('unauthorized_access', {
              reason: 'invite_expired',
              ip: clientIp,
              photoId,
              inviteCode: session.user.inviteCode,
            })
            return new NextResponse('Invite expired', { status: 403 })
          }
          
          hasAccess = true
        }
      }
    }

    // Check token-based access (for direct links)
    if (!hasAccess && token && session?.user.role === 'client') {
      const isValidToken = verifyImageAccessToken(token, photoId, session.user.id)
      if (isValidToken) {
        hasAccess = true
      } else {
        logSecurityEvent('unauthorized_access', {
          reason: 'invalid_token',
          ip: clientIp,
          photoId,
          token,
        })
      }
    }

    if (!hasAccess) {
      logSecurityEvent('unauthorized_access', {
        reason: 'no_permission',
        ip: clientIp,
        photoId,
        userId: session?.user?.id,
      })
      return new NextResponse('Access denied', { status: 403 })
    }

    // Log successful access
    logSecurityEvent('gallery_access', {
      photoId,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      ip: clientIp,
    })

    // Record analytics
    await prisma.analytics.create({
      data: {
        type: 'photo_view',
        photoId,
        galleryId: photo.collection.galleryId,
        clientId: session?.user?.role === 'client' ? session.user.id : null,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: clientIp,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Generate signed URL for the image
    const imageKey = photo.fileUrl.replace(/^https?:\/\/[^\/]+\//, '') // Extract S3 key from URL
    
    try {
      // For photographers, serve original images
      // For clients, serve watermarked versions (unless download is explicitly allowed)
      const shouldWatermark = !isPhotographer && 
                             photo.collection.gallery.watermarkEnabled &&
                             !url.searchParams.get('download')
      
      if (shouldWatermark) {
        // In a real implementation, this would serve a watermarked version
        // For now, we'll add a header to indicate watermarking should be applied
        const signedUrl = await generateSignedUrl(imageKey, 3600) // 1 hour expiry
        
        return NextResponse.redirect(signedUrl, {
          headers: {
            'X-Watermark': 'true',
            'X-Photographer': photo.collection.gallery.photographer.name,
            'Cache-Control': 'private, max-age=3600',
          },
        })
      } else {
        const signedUrl = await generateSignedUrl(imageKey, 3600)
        
        return NextResponse.redirect(signedUrl, {
          headers: {
            'Cache-Control': 'private, max-age=3600',
          },
        })
      }
    } catch (error) {
      console.error('Error generating signed URL:', error)
      return new NextResponse('Error accessing image', { status: 500 })
    }
  } catch (error) {
    console.error('Error in image API:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}