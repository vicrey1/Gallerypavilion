-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'photographer'
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "photographers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "equipment" TEXT,
    "experience" TEXT,
    "portfolio" TEXT,
    "socialMedia" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "photographers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clients_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "photographers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "photographerId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "expiresAt" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT false,
    "requirePassword" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "galleries_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "photographers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "galleryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "collections_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "galleryId" TEXT NOT NULL,
    "collectionId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL,
    "metadata" JSONB,
    "price" REAL,
    "isForSale" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "category" TEXT,
    "location" TEXT,
    "editionNumber" INTEGER DEFAULT 1,
    "totalEditions" INTEGER DEFAULT 1,
    "medium" TEXT,
    "technique" TEXT,
    "materials" TEXT,
    "artistStatement" TEXT,
    "provenance" TEXT,
    "certificateId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "photos_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "photos_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wishlist_items_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotoReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhotoReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhotoReview_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotographerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhotographerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhotographerReview_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "photographers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "clientEmail" TEXT,
    "type" TEXT NOT NULL DEFAULT 'single_use',
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME,
    "maxUsage" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "usedAt" DATETIME,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canFavorite" BOOLEAN NOT NULL DEFAULT true,
    "canComment" BOOLEAN NOT NULL DEFAULT false,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "canRequestPurchase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invites_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_invites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_invites_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photo_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "clientIp" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photo_favorites_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photo_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "clientIp" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photo_downloads_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL DEFAULT 'personal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "price" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_requests_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "galleryId" TEXT,
    "photoId" TEXT,
    "clientId" TEXT,
    "inviteCode" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analytics_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "photographers_userId_key" ON "photographers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_photoId_key" ON "wishlist_items"("userId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoReview_userId_photoId_key" ON "PhotoReview"("userId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographerReview_userId_photographerId_key" ON "PhotographerReview"("userId", "photographerId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invites_inviteCode_key" ON "invites"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "client_invites_clientId_inviteId_key" ON "client_invites"("clientId", "inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_clientId_photoId_key" ON "favorites"("clientId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_favorites_photoId_clientIp_key" ON "photo_favorites"("photoId", "clientIp");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");
