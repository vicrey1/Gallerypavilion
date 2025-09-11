export interface Photographer {
  id: string
  name: string
  email: string
  profile?: string
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  invitedBy: string
  createdAt: Date
}

export interface Gallery {
  id: string
  title: string
  description?: string
  photographerId: string
  visibility: 'private' | 'invite-only'
  expiryDate?: Date
  password?: string
  createdAt: Date
  updatedAt: Date
  collections: Collection[]
}

export interface Collection {
  id: string
  title: string
  description?: string
  galleryId: string
  permissions: {
    viewOnly: boolean
    canFavorite: boolean
    canRequestPurchase: boolean
    canDownload: boolean
  }
  photos: Photo[]
  createdAt: Date
}

export interface Photo {
  id: string
  collectionId: string
  filename: string
  fileUrl: string
  thumbnailUrl: string
  metadata: {
    width: number
    height: number
    size: number
    tags?: string[]
  }
  watermarked: boolean
  createdAt: Date
}

export interface Invite {
  id: string
  galleryId: string
  clientEmail: string
  status: 'pending' | 'active' | 'expired' | 'revoked'
  type: 'single-use' | 'multi-use' | 'expiring'
  code: string
  expiresAt?: Date
  usedAt?: Date
  createdAt: Date
}

export interface PurchaseRequest {
  id: string
  photoId: string
  clientId: string
  licenseType: 'personal' | 'commercial' | 'editorial'
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  createdAt: Date
}

export interface Analytics {
  galleryId: string
  photoId?: string
  clientId: string
  action: 'view' | 'favorite' | 'download' | 'purchase_request'
  timestamp: Date
  metadata?: Record<string, string | number | boolean | null>
}