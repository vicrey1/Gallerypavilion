import { prisma, withPrismaRetry } from '@/lib/prisma'

export interface CreateNotificationData {
  type: string
  title: string
  message: string
  userId: string
  data?: Record<string, unknown>
}

export async function createNotification(notificationData: CreateNotificationData) {
  try {
  const notification = await withPrismaRetry(() => prisma.notification.create({ data: { type: notificationData.type, title: notificationData.title, message: notificationData.message, userId: notificationData.userId, data: notificationData.data ? JSON.stringify(notificationData.data) : undefined, isRead: false } }))
  return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function createBulkNotifications(notifications: CreateNotificationData[]) {
  try {
  const createdNotifications = await withPrismaRetry(() => prisma.notification.createMany({ data: notifications.map(notif => ({ type: notif.type, title: notif.title, message: notif.message, userId: notif.userId, data: notif.data ? JSON.stringify(notif.data) : undefined, isRead: false })) }))
  return createdNotifications
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    throw error
  }
}

// Notification templates for common events
export const NotificationTemplates = {
  newPhoto: (photographerName: string, galleryTitle: string) => ({
    type: 'new_photo',
    title: 'New Photos Added',
    message: `${photographerName} added new photos to "${galleryTitle}"`
  }),

  priceChange: (photoTitle: string, oldPrice: number, newPrice: number) => ({
    type: 'price_change',
    title: 'Price Update',
    message: `Price for "${photoTitle}" changed from $${oldPrice} to $${newPrice}`
  }),

  purchaseUpdate: (status: string, photoTitle: string) => ({
    type: 'purchase_update',
    title: 'Purchase Update',
    message: `Your purchase request for "${photoTitle}" is now ${status}`
  }),

  galleryInvite: (photographerName: string, galleryTitle: string) => ({
    type: 'gallery_invite',
    title: 'Gallery Invitation',
    message: `${photographerName} invited you to view "${galleryTitle}"`
  }),

  reviewReceived: (reviewerName: string, rating: number) => ({
    type: 'review_received',
    title: 'New Review',
    message: `${reviewerName} left a ${rating}-star review on your photo`
  }),

  inviteSent: (clientEmail: string, galleryTitle: string) => ({
    type: 'invite_sent',
    title: 'Invitation Sent',
    message: `Gallery invitation sent to ${clientEmail} for "${galleryTitle}"`
  }),

  galleryExpiring: (galleryTitle: string, daysLeft: number) => ({
    type: 'gallery_expiring',
    title: 'Gallery Expiring Soon',
    message: `"${galleryTitle}" will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
  })
}

// Helper function to notify all gallery invitees
export async function notifyGalleryInvitees(
  galleryId: string,
  photographerName: string,
  galleryTitle: string,
  excludeUserId?: string
) {
  try {
    // Get all users who have access to this gallery
    let invites
    try {
      invites = await withPrismaRetry(() => prisma.invite.findMany({ where: { galleryId, status: 'active' }, include: { clientInvites: { include: { client: { include: { user: true } } } } } }))
    } catch (dbErr) {
      console.error('DB error fetching invites in notifyGalleryInvitees:', dbErr)
      throw dbErr
    }

    const notifications = invites
      .flatMap(invite => invite.clientInvites)
      .filter(clientInvite => clientInvite.client.userId !== excludeUserId)
      .map(clientInvite => ({
        ...NotificationTemplates.newPhoto(photographerName, galleryTitle),
        userId: clientInvite.client.userId,
        data: { galleryId, galleryTitle }
      }))

    if (notifications.length > 0) {
      await createBulkNotifications(notifications)
    }

    return notifications.length
  } catch (error) {
    console.error('Error notifying gallery invitees:', error)
    throw error
  }
}

// Helper function to notify photographer about new reviews
export async function notifyPhotographerOfReview(
  photographerId: string,
  reviewerName: string,
  rating: number,
  photoId: string,
  photoTitle: string
) {
  try {
    const notification = await createNotification({
      ...NotificationTemplates.reviewReceived(reviewerName, rating),
      userId: photographerId,
      data: { photoId, photoTitle, rating }
    })
    return notification
  } catch (error) {
    console.error('Error notifying photographer of review:', error)
    throw error
  }
}

// Helper function to check and notify about expiring galleries
export async function checkExpiringGalleries() {
  try {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    let expiringGalleries
    try {
      expiringGalleries = await withPrismaRetry(() => prisma.gallery.findMany({ where: { expiresAt: { lte: threeDaysFromNow, gte: new Date() }, status: 'active' }, include: { photographer: true } }))
    } catch (dbErr) {
      console.error('DB error fetching expiring galleries in checkExpiringGalleries:', dbErr)
      throw dbErr
    }

    const notifications = expiringGalleries.map(gallery => {
      const daysLeft = Math.ceil(
        (new Date(gallery.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      return {
        ...NotificationTemplates.galleryExpiring(gallery.title, daysLeft),
        userId: gallery.photographerId,
        data: { galleryId: gallery.id, expiresAt: gallery.expiresAt }
      }
    })

    if (notifications.length > 0) {
      await createBulkNotifications(notifications)
    }

    return notifications.length
  } catch (error) {
    console.error('Error checking expiring galleries:', error)
    throw error
  }
}