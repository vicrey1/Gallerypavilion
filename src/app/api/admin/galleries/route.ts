import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GalleryStatus, GalleryVisibility } from '@prisma/client'

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
    const photographerId = searchParams.get('photographerId')
    const skip = (page - 1) * limit

    const where: {
      status?: GalleryStatus
      photographerId?: string
    } = {}
    if (status) where.status = status as GalleryStatus
    if (photographerId) where.photographerId = photographerId

    const [galleries, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        skip,
        take: limit,
        include: {
          photographer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          collections: {
            include: {
              photos: {
                select: {
                  id: true,
                  filename: true,
                  thumbnailUrl: true
                },
                take: 1
              }
            },
            take: 1
          },
          invites: {
            select: {
              id: true,
              status: true
            }
          },
          _count: {
            select: {
              invites: true,
              collections: true,
              photos: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.gallery.count({ where })
    ])

    // Get view statistics for each gallery
    const galleriesWithStats = await Promise.all(
      galleries.map(async (gallery) => {
        const viewCount = await prisma.analytics.count({
          where: {
            type: 'gallery_access',
            galleryId: gallery.id
          }
        })

        const downloadCount = await prisma.analytics.count({
          where: {
            type: 'photo_download',
            galleryId: gallery.id
          }
        })

        return {
          ...gallery,
          stats: {
            views: viewCount,
            downloads: downloadCount,
            photos: gallery._count.photos,
            invites: gallery._count.invites,
            collections: gallery._count.collections
          },
          coverPhoto: gallery.collections[0]?.photos[0] || null
        }
      })
    )

    return NextResponse.json({
      galleries: galleriesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching galleries:', error)
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
    const { galleryId, action, status, visibility } = body

    if (!galleryId || !action) {
      return NextResponse.json(
        { error: 'Gallery ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: {
      status?: GalleryStatus
      visibility?: GalleryVisibility
    } = {}

    switch (action) {
      case 'archive':
        updateData = { status: 'archived' }
        break
      case 'activate':
        updateData = { status: 'active' }
        break
      case 'suspend':
        updateData = { status: 'archived' }
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
      case 'update_visibility':
        if (!visibility) {
          return NextResponse.json(
            { error: 'Visibility is required for update_visibility action' },
            { status: 400 }
          )
        }
        updateData = { visibility }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const gallery = await prisma.gallery.update({
      where: { id: galleryId },
      data: updateData,
      include: {
        photographer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: `gallery_${action}`,
          galleryId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: `Gallery ${action} successful`,
      gallery
    })
  } catch (error) {
    console.error('Error updating gallery:', error)
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
    const galleryId = searchParams.get('id')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    // Check if gallery exists
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      include: {
        photos: true,
        collections: true
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Delete gallery and all associated data
    await prisma.$transaction([
      // Delete favorites for photos in this gallery
      prisma.favorite.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete comments for photos in this gallery
      prisma.comment.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete purchase requests for photos in this gallery
      prisma.purchaseRequest.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete analytics for this gallery
      prisma.analytics.deleteMany({
        where: {
          OR: [
            {
              metadata: {
                path: ['galleryId'],
                equals: galleryId
              }
            },
            ...gallery.photos.map(photo => ({
              metadata: {
                path: ['photoId'],
                equals: photo.id
              }
            }))
          ]
        }
      }),
      // Delete photos
      prisma.photo.deleteMany({
        where: { galleryId }
      }),
      // Delete collections
      prisma.collection.deleteMany({
        where: { galleryId }
      }),
      // Delete invites
      prisma.invite.deleteMany({
        where: { galleryId }
      }),
      // Delete gallery
      prisma.gallery.delete({
        where: { id: galleryId }
      })
    ])

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: 'gallery_deleted',
          galleryId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: 'Gallery deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}