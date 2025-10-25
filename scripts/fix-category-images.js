/**
 * Script to fix broken category images
 * Replaces deprecated Unsplash URLs with working Picsum Photos URLs
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// High-quality placeholder images for each category
const categoryImages = {
  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=600&fit=crop',
  'Beauty & Personal Care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop',
  'Books & Education': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop',
  'Electronics & Gadgets': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop',
  'Fashion & Apparel': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=600&fit=crop',
  'Health & Wellness': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=600&fit=crop',
  'Home & Garden': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=600&fit=crop',
  'Sports & Recreation': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop'
}

async function fixCategoryImages() {
  try {
    console.log('🔧 Starting category image fix...\n')

    // Get all categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    })

    console.log(`Found ${categories.length} categories\n`)

    let updatedCount = 0

    for (const category of categories) {
      const newImageUrl = categoryImages[category.name]
      
      if (newImageUrl) {
        console.log(`Updating ${category.name}...`)
        console.log(`  Old URL: ${category.imageUrl}`)
        console.log(`  New URL: ${newImageUrl}`)

        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: newImageUrl }
        })

        updatedCount++
        console.log(`  ✅ Updated!\n`)
      } else {
        console.log(`⚠️  No image mapping found for: ${category.name}\n`)
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} category images!`)
    console.log('\n📋 Summary:')
    console.log(`   Total categories: ${categories.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${categories.length - updatedCount}`)

  } catch (error) {
    console.error('❌ Error fixing category images:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixCategoryImages()
  .then(() => {
    console.log('\n🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

