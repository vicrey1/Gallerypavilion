import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  businessName: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  equipment: z.string().optional(),
  experience: z.string().optional(),
  portfolio: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional()
  }).optional()
})

// GET /api/photographer/profile - Get photographer profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const photographer = await prisma.photographer.findUnique({
      where: { id: session.user.photographerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: photographer.id,
      name: photographer.user.name,
      email: photographer.user.email,
      businessName: photographer.businessName,
      website: photographer.website,
      phone: photographer.phone,
      bio: photographer.bio,
      equipment: photographer.equipment,
      experience: photographer.experience,
      portfolio: photographer.portfolio,
      socialMedia: photographer.socialMedia,
      status: photographer.status,
      createdAt: photographer.createdAt,
      updatedAt: photographer.updatedAt
    })
  } catch (error) {
    console.error('Error fetching photographer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/photographer/profile - Update photographer profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if photographer exists
    const existingPhotographer = await prisma.photographer.findUnique({
      where: { id: session.user.photographerId },
      include: { user: true }
    })

    if (!existingPhotographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Update photographer data
    const updateData: Partial<z.infer<typeof updateProfileSchema>> = {}
    
    if (validatedData.businessName !== undefined) updateData.businessName = validatedData.businessName
    if (validatedData.website !== undefined) updateData.website = validatedData.website || undefined
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
    if (validatedData.equipment !== undefined) updateData.equipment = validatedData.equipment
    if (validatedData.experience !== undefined) updateData.experience = validatedData.experience
    if (validatedData.portfolio !== undefined) updateData.portfolio = validatedData.portfolio || undefined
    if (validatedData.socialMedia !== undefined) updateData.socialMedia = validatedData.socialMedia

    const updatedPhotographer = await prisma.photographer.update({
      where: { id: session.user.photographerId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Update user name if provided
    if (validatedData.name && validatedData.name !== existingPhotographer.user.name) {
      await prisma.user.update({
        where: { id: existingPhotographer.userId },
        data: { name: validatedData.name }
      })
    }

    return NextResponse.json({
      id: updatedPhotographer.id,
      name: validatedData.name || updatedPhotographer.user.name,
      email: updatedPhotographer.user.email,
      businessName: updatedPhotographer.businessName,
      website: updatedPhotographer.website,
      phone: updatedPhotographer.phone,
      bio: updatedPhotographer.bio,
      equipment: updatedPhotographer.equipment,
      experience: updatedPhotographer.experience,
      portfolio: updatedPhotographer.portfolio,
      socialMedia: updatedPhotographer.socialMedia,
      status: updatedPhotographer.status,
      createdAt: updatedPhotographer.createdAt,
      updatedAt: updatedPhotographer.updatedAt
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating photographer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}