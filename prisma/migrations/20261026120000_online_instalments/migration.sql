-- CreateEnum
CREATE TYPE "OnlineAttemptStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'PAYSTACK';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paystackReference" TEXT;

-- CreateTable
CREATE TABLE "OnlinePaymentAttempt" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "OnlineAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayMessage" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlinePaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlinePaymentAttempt_reference_key" ON "OnlinePaymentAttempt"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "OnlinePaymentAttempt_paymentId_key" ON "OnlinePaymentAttempt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackReference_key" ON "Payment"("paystackReference");

-- AddForeignKey
ALTER TABLE "OnlinePaymentAttempt" ADD CONSTRAINT "OnlinePaymentAttempt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

