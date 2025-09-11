/*
  Warnings:

  - You are about to drop the column `canComment` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `canDownload` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `canFavorite` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsage` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `invites` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "clientEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canRequestPurchase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invites_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_invites" ("canRequestPurchase", "canView", "clientEmail", "createdAt", "galleryId", "id", "inviteCode", "status", "updatedAt") SELECT "canRequestPurchase", "canView", "clientEmail", "createdAt", "galleryId", "id", "inviteCode", "status", "updatedAt" FROM "invites";
DROP TABLE "invites";
ALTER TABLE "new_invites" RENAME TO "invites";
CREATE UNIQUE INDEX "invites_inviteCode_key" ON "invites"("inviteCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
