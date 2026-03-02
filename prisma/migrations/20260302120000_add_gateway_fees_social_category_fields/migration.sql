-- AlterTable: Add per-gateway fee fields to platform_settings
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "stripeGatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "stripeGatewayFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "qrBoliviaGatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "qrBoliviaGatewayFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "binancePayGatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "binancePayGatewayFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "cryptoGatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "cryptoGatewayFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "walletGatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "walletGatewayFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Add social media and contact fields to platform_settings
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "whatsappUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "telegramUrl" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "contactLocation" TEXT;

-- AlterTable: Add bannerImage and isPopular to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN NOT NULL DEFAULT false;
