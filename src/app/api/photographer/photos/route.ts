import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validatePhotoData } from '@/lib/validation/photo'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

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
        select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnailUrl: true,
        filename: true,
        fileSize: true,
        width: true,
        height: true,
        mimeType: true,
        metadata: true,
        price: true,
        isForSale: true,
        tags: true,
        category: true,
        location: true,
        sortOrder: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        
        // Artwork Information
        photographerName: true,
        yearCreated: true,
        yearPrinted: true,
        seriesName: true,
        
        // Edition & Authenticity
        editionNumber: true,
        editionSize: true,
        signatureType: true,
        certificateOfAuthenticity: true,
        certificateId: true,
        
        // Materials & Size
        medium: true,
        printingTechnique: true,
        paperType: true,
        dimensions: true,
        framingOptions: true,
        
        // Context
        artistStatement: true,
        exhibitionHistory: true,
        
        // Purchase Information
        shippingDetails: true,
        returnPolicy: true,
        
        // Analytics
        _count: {
          select: {
            favorites: true,
            photoDownloads: true
          }
        }
      }
    }),
      prisma.photo.count({ where: { galleryId } })
    ]);

    // Transform any JSON string fields back to objects/arrays
    const transformedPhotos = photos.map(photo => ({
      ...photo,
      tags: photo.tags ? JSON.parse(photo.tags as string) : [],
      dimensions: photo.dimensions ? JSON.parse(photo.dimensions as string) : null,
      framingOptions: photo.framingOptions ? JSON.parse(photo.framingOptions as string) : null,
      exhibitionHistory: photo.exhibitionHistory ? JSON.parse(photo.exhibitionHistory as string) : null,
      shippingDetails: photo.shippingDetails ? JSON.parse(photo.shippingDetails as string) : null,
      favorites: photo._count?.favorites || 0,
      downloads: photo._count?.photoDownloads || 0
    }))

    return NextResponse.json({
      photos: transformedPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const uploadPhotoSchema = z.object({
  galleryId: z.string().min(1, 'Gallery ID is required'),
  
  // Basic Information
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  isForSale: z.string().transform(val => val === 'true').optional(),
  tags: z.string().optional(), // Will be parsed as JSON
  category: z.string().optional(),
  location: z.string().optional(),

  // Artwork Information
  photographerName: z.string().optional(),
  yearCreated: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format').optional(),
  yearPrinted: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format').optional(),
  seriesName: z.string().optional(),

  // Edition & Authenticity
  editionNumber: z.string().regex(/^\d+\/\d+$/, 'Edition number must be in format "n/m"').optional(),
  editionSize: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  signatureType: z.string().optional(),
  certificateOfAuthenticity: z.string().transform(val => val === 'true').optional(),

  // Materials & Size
  medium: z.string().optional(),
  printingTechnique: z.string().optional(),
  paperType: z.string().optional(),
  dimensions: z.string().optional(), // Will be parsed as JSON { image?, paper?, framed? }
  framingOptions: z.string().optional(), // Will be parsed as JSON string[]

  // Context
  artistStatement: z.string().optional(),
  exhibitionHistory: z.string().optional(), // Will be parsed as JSON string[]

  // Purchase Information
  shippingMethod: z.string().optional(),
  shippingTimeframe: z.string().optional(),
  returnPolicy: z.string().optional(),
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
    
    // Get all form data
    const photoData = {
      // File and Gallery
      file: formData.get('file') as File,
      galleryId: formData.get('galleryId') as string,
      
      // Basic Information
      title: formData.get('title') as string || '',
      description: formData.get('description') as string || '',
      price: formData.get('price') as string,
      isForSale: formData.get('isForSale') as string,
      tags: formData.get('tags') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,

      // Artwork Information
      photographerName: formData.get('photographerName') as string,
      yearCreated: formData.get('yearCreated') as string,
      yearPrinted: formData.get('yearPrinted') as string,
      seriesName: formData.get('seriesName') as string,

      // Edition & Authenticity
      editionNumber: formData.get('editionNumber') as string,
      editionSize: formData.get('editionSize') as string,
      signatureType: formData.get('signatureType') as string,
      certificateOfAuthenticity: formData.get('certificateOfAuthenticity') as string,

      // Materials & Size
      medium: formData.get('medium') as string,
      printingTechnique: formData.get('printingTechnique') as string,
      paperType: formData.get('paperType') as string,
      dimensions: formData.get('dimensions') as string,
      framingOptions: formData.get('framingOptions') as string,

      // Context
      artistStatement: formData.get('artistStatement') as string,
      exhibitionHistory: formData.get('exhibitionHistory') as string,

      // Purchase Information
      shippingMethod: formData.get('shippingMethod') as string,
      shippingTimeframe: formData.get('shippingTimeframe') as string,
      returnPolicy: formData.get('returnPolicy') as string,
    }

  // Local aliases for commonly referenced fields
  const { galleryId, tags } = photoData

    const file = photoData.file

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
    let processedTags: any = null
    if (tags) {
      try {
        processedTags = JSON.parse(tags)
      } catch {
        // If tags is not valid JSON, treat as comma-separated string
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    }

    // Validate photo data
    const validationResult = validatePhotoData({
      ...photoData,
      tags: processedTags
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.errors
        },
        { status: 400 }
      )
    }

    // Extract validated data with defaults
    const validatedData = {
      title: file.name,
      description: '',
      price: null,
      isForSale: false,
      tags: null,
      category: null,
      location: null,
      ...validationResult.data
    }

  // Save photo record to database
  const photo = await prisma.photo.create({
        data: {
          galleryId,
          // Basic Information
          title: validatedData.title,
          description: validatedData.description,
          url: `/uploads/photos/${fileName}`,
          thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
          filename: fileName,
          fileSize: file.size,
          mimeType: file.type,
          price: validatedData.price,
          isForSale: validatedData.isForSale,
          tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
          category: validatedData.category,
          location: validatedData.location,

  // ...existing code...
      },
    })

    return NextResponse.json({
      // Basic Information
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

  // ...existing code...
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Ensure all function scopes are properly closed


