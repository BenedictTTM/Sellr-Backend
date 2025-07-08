-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "lastRatingUpdate" TIMESTAMP(3),
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_averageRating_idx" ON "Product"("averageRating");
