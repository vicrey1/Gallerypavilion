import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

const inviteLoginSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
  email: z.string().email().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inviteCode, email } = inviteLoginSchema.parse(body)

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { code: inviteCode },
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

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      )
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite code has expired' },
        { status: 400 }
      )
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'Invite code has already been used' },
        { status: 400 }
      )
    }

    // Create or find client user
    let clientUser
    if (email) {
      // Try to find existing client user
      clientUser = await prisma.user.findFirst({
        where: {
          email,
          role: 'CLIENT'
        },
        include: {
          client: true
        }
      })

      if (!clientUser) {
        // Create new client user
        await prisma.$transaction(async (tx) => {
          clientUser = await tx.user.create({
            data: {
              email,
              role: 'CLIENT',
              name: email.split('@')[0] // Use email prefix as name
            }
          })

          await tx.client.create({
            data: {
              userId: clientUser.id
            }
          })
        })

        // Refetch with client relation
        clientUser = await prisma.user.findUnique({
          where: { id: clientUser.id },
          include: { client: true }
        })
      }
    } else {
      // Create anonymous client user
      await prisma.$transaction(async (tx) => {
        clientUser = await tx.user.create({
          data: {
            email: `guest_${Date.now()}@temp.com`,
            role: 'CLIENT',
            name: `Guest ${Date.now()}`
          }
        })

        await tx.client.create({
          data: {
            userId: clientUser.id
          }
        })
      })

      // Refetch with client relation
      clientUser = await prisma.user.findUnique({
        where: { id: clientUser.id },
        include: { client: true }
      })
    }

    // Mark invite as used
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedBy: clientUser.email
      }
    })

    // Generate JWT token
    const token = generateToken({
      userId: clientUser.id,
      email: clientUser.email,
      role: clientUser.role,
      clientId: clientUser.client?.id
    })

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        client: clientUser.client
      },
      galleryId: invite.galleryId
    })

  } catch (error) {
    console.error('Invite login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}