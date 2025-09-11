-- CreateTable
ALTER TABLE "Photo" ADD COLUMN "title" TEXT NOT NULL;
ALTER TABLE "Photo" ADD COLUMN "description" TEXT;
ALTER TABLE "Photo" ALTER COLUMN "price" TYPE REAL;
ALTER TABLE "Photo" ADD COLUMN "category" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "location" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "photographerName" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "yearCreated" CHAR(4);
ALTER TABLE "Photo" ADD COLUMN "yearPrinted" CHAR(4);
ALTER TABLE "Photo" ADD COLUMN "seriesName" VARCHAR(200);
ALTER TABLE "Photo" ADD COLUMN "editionNumber" VARCHAR(20);
ALTER TABLE "Photo" ADD COLUMN "editionSize" INTEGER;
ALTER TABLE "Photo" ADD COLUMN "signatureType" VARCHAR(50);
ALTER TABLE "Photo" ADD COLUMN "certificateOfAuthenticity" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Photo" ADD COLUMN "medium" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "printingTechnique" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "paperType" VARCHAR(100);
ALTER TABLE "Photo" ADD COLUMN "dimensions" JSON;
ALTER TABLE "Photo" ADD COLUMN "framingOptions" JSON;
ALTER TABLE "Photo" ADD COLUMN "artistStatement" TEXT;
ALTER TABLE "Photo" ADD COLUMN "exhibitionHistory" JSON;
ALTER TABLE "Photo" ADD COLUMN "shippingDetails" JSON;
ALTER TABLE "Photo" ADD COLUMN "returnPolicy" TEXT;

-- CreateIndexes
CREATE INDEX "Photo_category_idx" ON "Photo"("category");
CREATE INDEX "Photo_yearCreated_idx" ON "Photo"("yearCreated");
CREATE INDEX "Photo_price_idx" ON "Photo"("price");
