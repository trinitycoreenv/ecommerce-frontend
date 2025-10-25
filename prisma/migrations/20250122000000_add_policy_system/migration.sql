-- CreateEnum for PolicyType
CREATE TYPE "PolicyType" AS ENUM ('PROHIBITED_PRODUCT', 'COUNTERFEIT', 'CONTENT_RESTRICTION', 'SELLER_BEHAVIOR', 'PRICING', 'SHIPPING', 'QUALITY_STANDARD');

-- CreateEnum for PolicySeverity
CREATE TYPE "PolicySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum for ViolationStatus
CREATE TYPE "ViolationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'APPEALED', 'REJECTED');

-- CreateTable for Policy
CREATE TABLE "policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "severity" "PolicySeverity" NOT NULL DEFAULT 'MEDIUM',
    "rules" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_enforce" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable for PolicyViolation
CREATE TABLE "policy_violations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "status" "ViolationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "flagged_by" UUID,
    "reviewed_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "appeal_message" TEXT,
    "appeal_documents" JSONB,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policies_type_idx" ON "policies"("type");
CREATE INDEX "policies_is_active_idx" ON "policies"("is_active");
CREATE INDEX "policy_violations_product_id_idx" ON "policy_violations"("product_id");
CREATE INDEX "policy_violations_vendor_id_idx" ON "policy_violations"("vendor_id");
CREATE INDEX "policy_violations_status_idx" ON "policy_violations"("status");
CREATE INDEX "policy_violations_policy_id_idx" ON "policy_violations"("policy_id");

-- AddForeignKey
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

