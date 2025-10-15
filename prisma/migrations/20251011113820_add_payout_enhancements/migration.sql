-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "payout_id" UUID;

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "max_retries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripe_transfer_id" TEXT;

-- CreateTable
CREATE TABLE "vendor_payout_settings" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "payout_frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "minimum_payout" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "payout_method" TEXT NOT NULL DEFAULT 'STRIPE',
    "stripe_account_id" TEXT,
    "bank_account_details" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_payout_date" TIMESTAMP(3),
    "next_payout_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_payout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payout_settings_vendor_id_key" ON "vendor_payout_settings"("vendor_id");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payout_settings" ADD CONSTRAINT "vendor_payout_settings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
