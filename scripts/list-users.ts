import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('👥 Listing all users...\n')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  })

  console.log(`Found ${users.length} users:\n`)

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || 'No name'}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   ID: ${user.id}`)
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

