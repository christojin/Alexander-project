-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'DEPOSIT_CREDIT';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "vemperProductId" TEXT;

-- CreateTable
CREATE TABLE "wallet_deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "coin" TEXT NOT NULL DEFAULT 'USDT',
    "network" TEXT NOT NULL DEFAULT 'TRC20',
    "depositAddress" TEXT NOT NULL,
    "memoCode" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "txId" TEXT,
    "actualAmount" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_deposits_memoCode_key" ON "wallet_deposits"("memoCode");

-- CreateIndex
CREATE INDEX "wallet_deposits_userId_idx" ON "wallet_deposits"("userId");

-- CreateIndex
CREATE INDEX "wallet_deposits_status_idx" ON "wallet_deposits"("status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vemperProductId_fkey" FOREIGN KEY ("vemperProductId") REFERENCES "vemper_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_deposits" ADD CONSTRAINT "wallet_deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
