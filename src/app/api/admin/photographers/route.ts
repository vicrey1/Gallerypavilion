import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PhotographerStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where = status ? { status: status as PhotographerStatus } : {}

    const [photographers, total] = await Promise.all([
      prisma.photographer.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          galleries: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: {
              galleries: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.photographer.count({ where })
    ])

    return NextResponse.json({
      photographers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching photographers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { photographerId, action, status } = body

    if (!photographerId || !action) {
      return NextResponse.json(
        { error: 'Photographer ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: {
      status?: 'approved' | 'suspended' | 'rejected'
    } = {}

    switch (action) {
      case 'approve':
        updateData = { status: 'approved' }
        break
      case 'suspend':
        updateData = { status: 'suspended' }
        break
      case 'reject':
        updateData = { status: 'rejected' }
        break
      case 'reactivate':
        updateData = { status: 'approved' }
        break
      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          )
        }
        updateData = { status }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const photographer = await prisma.photographer.update({
      where: { id: photographerId },
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

    return NextResponse.json({
      message: `Photographer ${action} successful`,
      photographer
    })
  } catch (error) {
    console.error('Error updating photographer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const photographerId = searchParams.get('id')

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    // Check if photographer has galleries
    const galleryCount = await prisma.gallery.count({
      where: { photographerId }
    })

    if (galleryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete photographer with existing galleries. Archive galleries first.' },
        { status: 400 }
      )
    }

    // Delete photographer and associated user
    const photographer = await prisma.photographer.findUnique({
      where: { id: photographerId },
      include: { user: true }
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    await prisma.$transaction([
      prisma.photographer.delete({
        where: { id: photographerId }
      }),
      prisma.user.delete({
        where: { id: photographer.userId }
      })
    ])

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: 'photographer_deleted',
          photographerId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: 'Photographer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting photographer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}