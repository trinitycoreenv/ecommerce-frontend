-- CreateTable
CREATE TABLE "trial_usage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "payment_card_last4" TEXT,
    "stripe_customer_id" TEXT,
    "trial_start_date" TIMESTAMP(3) NOT NULL,
    "trial_end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "conversion_date" TIMESTAMP(3),
    "cancellation_date" TIMESTAMP(3),
    "fraud_score" INTEGER NOT NULL DEFAULT 0,
    "is_fraudulent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_usage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trial_usage" ADD CONSTRAINT "trial_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_usage" ADD CONSTRAINT "trial_usage_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
