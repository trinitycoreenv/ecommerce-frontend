import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating Premium Cotton T-Shirt image...')

  const product = await prisma.product.update({
    where: {
      sku: 'PCT-001'
    },
    data: {
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop']
    }
  })

  console.log('✅ Successfully updated product image!')
  console.log(`   Product: ${product.name}`)
  console.log(`   SKU: ${product.sku}`)
  console.log(`   New Image: ${product.images[0]}`)
}

main()
  .catch((e) => {
    console.error('❌ Error updating product image:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

