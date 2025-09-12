import { NextRequest, NextResponse } from 'next/server'

// Temporarily return a 404 since photographer registration is disabled
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Photographer registration is currently disabled. Please contact the administrator.' },
    { status: 404 }
  )
}
    })
    
    if (existingPhotographer) {
      return NextResponse.json(
        { error: 'A photographer with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash the password - use same cost factor as seed.ts
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Normalize email to lowercase
    const normalizedEmail = validatedData.email.toLowerCase()
    
    // Create user and photographer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'photographer'
        }
      })
      
      // Create photographer profile
      const photographer = await tx.photographer.create({
        data: {
          userId: user.id,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          businessName: validatedData.businessName || null,
          website: validatedData.website || null,
          phone: validatedData.phone || null,
          bio: validatedData.bio || null,
          equipment: validatedData.equipment || null,
          experience: validatedData.experience || null,
          portfolio: validatedData.portfolio || null,
          socialMedia: validatedData.instagram ? {
            instagram: validatedData.instagram
          } : Prisma.JsonNull,
          status: 'pending' // Default status for admin approval
        }
      })
      
      return { user, photographer }
    })
    
    
    return NextResponse.json({
      message: 'Photographer registration successful',
      photographer: {
        id: result.photographer.id,
        name: result.photographer.name,
        email: result.user.email,
        status: result.photographer.status
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Photographer registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      console.error('Prisma error code:', error.code, 'Message:', error.message)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }
    
    // Handle other database errors
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      console.error('Unknown Prisma error:', error.message)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }
    
    // Log the full error for debugging
    console.error('Unexpected error during registration:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}