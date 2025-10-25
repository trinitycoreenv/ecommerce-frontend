import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking policies in database...\n')

  const policies = await prisma.policy.findMany({
    include: {
      _count: {
        select: {
          violations: true
        }
      }
    }
  })

  console.log(`Found ${policies.length} policies:\n`)

  policies.forEach((policy, index) => {
    console.log(`${index + 1}. ${policy.name}`)
    console.log(`   Type: ${policy.type}`)
    console.log(`   Severity: ${policy.severity}`)
    console.log(`   Active: ${policy.isActive}`)
    console.log(`   Auto-Enforce: ${policy.autoEnforce}`)
    console.log(`   Violations: ${policy._count.violations}`)
    console.log(`   Rules: ${JSON.stringify(policy.rules).substring(0, 100)}...`)
    console.log('')
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

