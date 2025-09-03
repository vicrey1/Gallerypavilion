import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const uploadPhotoSchema = z.object({
  galleryId: z.string().min(1, 'Gallery ID is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  isForSale: z.string().transform(val => val === 'true').optional(),
  tags: z.string().optional(), // Will be parsed as JSON
  category: z.string().optional(),
  location: z.string().optional(),
  editionNumber: z.string().transform(val => val ? parseInt(val) : 1).optional(),
  totalEditions: z.string().transform(val => val ? parseInt(val) : 1).optional(),
  medium: z.string().optional(),
  technique: z.string().optional(),
  materials: z.string().optional(),
  artistStatement: z.string().optional(),
  provenance: z.string().optional(),
  certificateId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const galleryId = formData.get('galleryId') as string
    const title = formData.get('title') as string || ''
    const description = formData.get('description') as string || ''
    const price = formData.get('price') as string
    const isForSale = formData.get('isForSale') as string
    const tags = formData.get('tags') as string
    const category = formData.get('category') as string
    const location = formData.get('location') as string
    const editionNumber = formData.get('editionNumber') as string
    const totalEditions = formData.get('totalEditions') as string
    const medium = formData.get('medium') as string
    const technique = formData.get('technique') as string
    const materials = formData.get('materials') as string
    const artistStatement = formData.get('artistStatement') as string
    const provenance = formData.get('provenance') as string
    const certificateId = formData.get('certificateId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Check if gallery exists and belongs to photographer
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        photographerId: session.user.photographerId,
      },
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const thumbnailName = `thumb_${fileName}`

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'photos')
    const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'thumbnails')
    
    try {
      await mkdir(uploadDir, { recursive: true })
      await mkdir(thumbnailDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // For now, we'll use the same image as thumbnail
    // In a real application, you'd want to generate a proper thumbnail
    const thumbnailPath = join(thumbnailDir, thumbnailName)
    await writeFile(thumbnailPath, buffer)

    // Process tags if provided
    let processedTags = null
    if (tags) {
      try {
        processedTags = JSON.stringify(JSON.parse(tags))
      } catch {
        // If tags is not valid JSON, treat as comma-separated string
        processedTags = JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag))
      }
    }

    // Save photo record to database
    const photo = await prisma.photo.create({
      data: {
        galleryId,
        title: title || file.name,
        description,
        url: `/uploads/photos/${fileName}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
        filename: fileName,
        fileSize: file.size,
        mimeType: file.type,
        price: price ? parseFloat(price) : null,
        isForSale: isForSale === 'true',
        tags: processedTags,
        category: category || null,
        location: location || null,
        editionNumber: editionNumber ? parseInt(editionNumber) : 1,
        totalEditions: totalEditions ? parseInt(totalEditions) : 1,
        medium: medium || null,
        technique: technique || null,
        materials: materials || null,
        artistStatement: artistStatement || null,
        provenance: provenance || null,
        certificateId: certificateId || null,
      },
    })

    return NextResponse.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      createdAt: photo.createdAt,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      price: photo.price,
      isForSale: photo.isForSale,
      tags: photo.tags ? JSON.parse(photo.tags as string) : [],
      category: photo.category,
      location: photo.location,
      editionNumber: photo.editionNumber,
      totalEditions: photo.totalEditions,
      medium: photo.medium,
      technique: photo.technique,
      materials: photo.materials,
      artistStatement: photo.artistStatement,
      provenance: photo.provenance,
      certificateId: photo.certificateId,
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.photographerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Photographer access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('galleryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    // Check if gallery belongs to photographer
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        photographerId: session.user.photographerId,
      },
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * limit

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { galleryId },
        include: {
          _count: {
            select: {
              favorites: true,
              downloads: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where: { galleryId } }),
    ])

    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      createdAt: photo.createdAt,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      favorites: photo._count.favorites,
      downloads: photo._count.downloads,
    }))

    return NextResponse.json({
      photos: formattedPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}