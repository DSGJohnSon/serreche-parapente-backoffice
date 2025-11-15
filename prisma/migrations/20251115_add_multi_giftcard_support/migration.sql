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