-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "offersQuota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promotionQuota" INTEGER NOT NULL DEFAULT 0;
