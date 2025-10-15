import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateProOnlyTrial() {
  try {
    console.log('🔄 Updating subscription plans with Pro-only trial strategy...')

    // Update all plans - remove trials from Basic and Enterprise, keep only Pro
    const updates = [
      {
        tier: 'BASIC',
        updates: {
          trialDays: 0,
          features: [
            'Up to 50 products',
            'Up to 100 orders/month',
            'Basic analytics',
            'Email support',
            '12% commission rate',
            'No trial - immediate access'
          ]
        }
      },
      {
        tier: 'PREMIUM',
        updates: {
          trialDays: 14,
          features: [
            'Up to 200 products',
            'Up to 500 orders/month',
            'Advanced analytics',
            'Priority support',
            '8% commission rate',
            'Custom branding',
            'API access',
            '14-day free trial (payment card required)'
          ]
        }
      },
      {
        tier: 'ENTERPRISE',
        updates: {
          trialDays: 0,
          features: [
            'Unlimited products',
            'Unlimited orders',
            'Premium analytics',
            'Dedicated support',
            '5% commission rate',
            'White-label solution',
            'Custom integrations',
            'SLA guarantee',
            'No trial - immediate access'
          ]
        }
      }
    ]

    // Update existing plans
    for (const update of updates) {
      await prisma.subscriptionPlan.updateMany({
        where: { tier: update.tier },
        data: update.updates
      })
      console.log(`✅ Updated ${update.tier} plan`)
    }

    // Keep Starter plan as is (free forever)
    console.log('✅ Starter plan remains free forever')

    console.log('🎉 Subscription plans updated with Pro-only trial strategy!')
    console.log('')
    console.log('📋 Updated Trial Strategy:')
    console.log('🆓 Starter Plan: ₱0/month (Forever Free) - 10 products, 25 orders/month')
    console.log('📋 Basic Plan: ₱2,000/month (No Trial) - Immediate access, payment required')
    console.log('🚀 Pro Plan: ₱5,000/month (14-day trial) - Payment card required for trial')
    console.log('🏢 Enterprise Plan: ₱10,000/month (No Trial) - Immediate access, payment required')
    console.log('')
    console.log('💡 Benefits of Pro-only trial:')
    console.log('• Reduces revenue loss from multiple free trials')
    console.log('• Payment card requirement ensures authenticity')
    console.log('• Targets serious businesses with Pro plan')
    console.log('• Prevents trial abuse across multiple plans')
    console.log('• Maintains financial sustainability')
  } catch (error) {
    console.error('❌ Error updating Pro-only trial:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateProOnlyTrial()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
