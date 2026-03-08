-- CreateTable (ajouté pour la shadow database - la table existait avant les migrations tracées)
CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "usedByOrderId" TEXT,
    "appliedToOrderId" TEXT,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS pour éviter les doublons en prod)
CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_code_key" ON "GiftCard"("code");

-- AlterTable
ALTER TABLE "GiftCard" ADD COLUMN "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- Update existing gift cards to set remainingAmount = amount
UPDATE "GiftCard" SET "remainingAmount" = "amount" WHERE "remainingAmount" = 0;

-- CreateTable
CREATE TABLE "OrderGiftCard" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderGiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderGiftCard_orderId_idx" ON "OrderGiftCard"("orderId");

-- CreateIndex
CREATE INDEX "OrderGiftCard_giftCardId_idx" ON "OrderGiftCard"("giftCardId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderGiftCard_orderId_giftCardId_key" ON "OrderGiftCard"("orderId", "giftCardId");

-- AddForeignKey
ALTER TABLE "OrderGiftCard" ADD CONSTRAINT "OrderGiftCard_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderGiftCard" ADD CONSTRAINT "OrderGiftCard_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;