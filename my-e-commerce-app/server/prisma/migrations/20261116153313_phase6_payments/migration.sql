/*
  Warnings:

  - Added the required column `totalPaid` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionReference` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "totalPaid" INTEGER NOT NULL,
ADD COLUMN     "transactionReference" TEXT NOT NULL;
