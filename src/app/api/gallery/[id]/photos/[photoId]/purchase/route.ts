import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

const requestSchema = z.object({
  inviteCode: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const params = await context.params
    const galleryId = params.id
    const photoId = params.photoId

    const body = await request.json().catch(() => ({}))

    // Normalize empty-string email to undefined
    if (body && typeof body.email === "string" && body.email.trim() === "") {
      delete body.email
    }

    const { inviteCode, email: rawEmail, message } = requestSchema.parse(body)

    // If inviteCode exists, prefer the invite's clientEmail when present
    let email = rawEmail
    let inviteRecord = null
    if (inviteCode) {
      inviteRecord = await prisma.invite.findFirst({
        where: { inviteCode, galleryId, status: "active" },
      })
      if (inviteRecord && inviteRecord.clientEmail) email = inviteRecord.clientEmail
    }

    // Verify photo exists and is for sale and gallery is active
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, galleryId, isForSale: true },
      include: { gallery: { include: { photographer: true } } },
    })

    if (!photo || photo.gallery?.status !== "active") {
      return NextResponse.json({ error: "Photo not found or not available for purchase" }, { status: 404 })
    }

    // If an invite was provided, ensure it allows requests
    if (inviteCode) {
      if (!inviteRecord || inviteRecord.status !== "active" || !inviteRecord.canRequestPurchase) {
        return NextResponse.json({ error: "Invite not valid for purchase requests" }, { status: 403 })
      }
    }

    // Email is required for creating client/user
    if (!email) {
      return NextResponse.json({ error: "Client email is required for purchase requests" }, { status: 400 })
    }

    // Transaction: ensure User & Client exist, create analytics, purchaseRequest, notification
    const result = await prisma.$transaction(async (tx) => {
      // Ensure User exists
      let user = await tx.user.findUnique({ where: { email } })
      if (!user) {
        user = await tx.user.create({ data: { email, name: email.split("@")[0], role: "client" } })
      }

      // Ensure Client exists
      let client = await tx.client.findFirst({ where: { email } })
      if (!client) {
        client = await tx.client.create({
          data: {
            email,
            name: user.name || email.split("@")[0],
            invitedBy: photo.gallery?.photographerId ?? undefined,
            userId: user.id,
          },
        })
      }

      // Analytics
      await tx.analytics.create({
        data: {
          type: "purchase_request",
          photoId,
          galleryId,
          metadata: { clientId: client.id, inviteCode: inviteCode || null, message } as any,
        },
      })

      // Purchase request
      const purchaseRequest = await tx.purchaseRequest.create({
        data: {
          photoId,
          clientId: client.id,
          message: message || undefined,
          status: "pending",
          licenseType: "personal",
          price: photo.price || undefined,
        },
      })

      // Notification to photographer's user (best-effort)
  const photographerUserId = photo.gallery?.photographer?.userId ?? photo.gallery?.photographerId ?? undefined
      if (photographerUserId) {
        await tx.notification.create({
          data: {
            type: "PURCHASE_REQUEST",
            userId: photographerUserId,
            title: "New Purchase Request",
            message: `A client requested "${photo.title || "Untitled"}" from "${photo.gallery?.title || "Gallery"}"`,
            data: JSON.stringify({ photoId, galleryId, purchaseRequestId: purchaseRequest.id, clientEmail: email }),
          },
        })
      }

      return { purchaseRequest }
    })

    return NextResponse.json({ success: true, purchaseRequestId: result.purchaseRequest.id }, { status: 201 })
  } catch (err) {
    console.error("Error processing purchase request:", err)

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: err.issues }, { status: 400 })
    }

    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return NextResponse.json({ error: "Related record missing or invalid" }, { status: 400 })
      }
      if (err.code === "P2002") {
        return NextResponse.json({ error: "Duplicate record" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
