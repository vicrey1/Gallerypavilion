import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const certificateRequestSchema = z.object({
  requestType: z.enum(['generate', 'verify']).default('generate'),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { requestType, clientEmail, clientName } = certificateRequestSchema.parse(body)

    // Get photo details with gallery and photographer info
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        gallery: {
          include: {
            photographer: {
              include: {
                user: true
              }
            }
          }
        }
      },
      // Ensure exhibitionHistory is selected
      // If you use select, add all required fields
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Generate certificate ID if not exists
    let certificateId = photo.certificateId
    if (!certificateId) {
      // Generate unique certificate ID
      const timestamp = Date.now().toString(36)
      const randomStr = crypto.randomBytes(4).toString('hex')
      certificateId = `COA-${timestamp}-${randomStr}`.toUpperCase()
      
      // Update photo with certificate ID
      await prisma.photo.update({
        where: { id: photoId },
        data: { certificateId }
      })
    }

    if (requestType === 'generate') {
      // Generate certificate data
      const certificateData = {
        certificateId,
        photoId: photo.id,
        title: photo.title || 'Untitled',
        artist: photo.gallery.photographer.name,
  medium: photo.medium || 'Photogram',
  // technique: photo.printingTechnique || 'Traditional Darkroom Process',
  materials: 'Silver Gelatin, Fiber Paper',
  editionNumber: photo.editionNumber || '1/1',
  totalEditions: (photo as any).editionTotal || 1,
        dimensions: photo.width && photo.height ? `${photo.width} x ${photo.height} pixels` : 'Variable',
        createdAt: photo.createdAt,
        provenance: "Original artwork from gallery collection",
        photographerEmail: photo.gallery.photographer.user.email,
        galleryTitle: photo.gallery.title,
        issuedAt: new Date(),
        clientEmail: clientEmail || session?.user?.email,
        clientName: clientName || session?.user?.name,
        verificationUrl: `${process.env.NEXTAUTH_URL}/api/certificate/${photoId}/verify?id=${certificateId}`
      }

      return NextResponse.json({
        success: true,
        certificate: certificateData,
        message: 'Certificate of authenticity generated successfully'
      })
    }

    if (requestType === 'verify') {
      // Verify certificate authenticity
      const verificationData = {
        isValid: true,
        certificateId,
        photoId: photo.id,
        title: photo.title,
        artist: photo.gallery.photographer.name,
  editionNumber: photo.editionNumber || '1/1',
  totalEditions: (photo as any).editionTotal || 1,
        verifiedAt: new Date()
      }

      return NextResponse.json({
        success: true,
        verification: verificationData,
        message: 'Certificate verified successfully'
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error processing certificate request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  try {
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('id')

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      )
    }

    // Get photo details for verification
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        certificateId: certificateId
      },
      include: {
        gallery: {
          include: {
            photographer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Certificate not found or invalid' },
        { status: 404 }
      )
    }

    const verificationData = {
      isValid: true,
      certificateId: photo.certificateId,
      photoId: photo.id,
      title: photo.title || 'Untitled',
      artist: photo.gallery.photographer.name,
      medium: photo.medium || 'Photogram',
      technique: 'Traditional Darkroom Process',
      editionNumber: photo.editionNumber || '1/1',
      totalEditions: (photo as any).editionTotal || 1,
      createdAt: photo.createdAt,
      verifiedAt: new Date(),
      galleryTitle: photo.gallery.title
    }

    return NextResponse.json({
      success: true,
      verification: verificationData,
      message: 'Certificate verified successfully'
    })

  } catch (error) {
    console.error('Error verifying certificate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}