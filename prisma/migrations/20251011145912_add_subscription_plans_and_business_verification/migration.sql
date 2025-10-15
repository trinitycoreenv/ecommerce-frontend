/*
  Warnings:

  - Added the required column `plan_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "auto_renew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "next_billing_date" TIMESTAMP(3),
ADD COLUMN     "plan_id" UUID,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "trial_end_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "refund_reference_id" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" JSONB,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "bank_details" JSONB,
ADD COLUMN     "business_type" TEXT;

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "max_products" INTEGER,
    "max_orders" INTEGER,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_verifications" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "business_license" TEXT,
    "tax_id" TEXT,
    "business_address" JSONB,
    "phone_number" TEXT,
    "website" TEXT,
    "business_type" TEXT,
    "documents" JSONB NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_verifications_vendor_id_key" ON "business_verifications"("vendor_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
