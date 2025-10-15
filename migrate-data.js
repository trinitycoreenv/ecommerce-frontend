const { PrismaClient } = require('@prisma/client');

// Local database connection
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL
    }
  }
});

// Render database connection
const renderPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_RENDER
    }
  }
});

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from local to Render...');
    
    // Test connections
    console.log('📡 Testing local database connection...');
    await localPrisma.$connect();
    console.log('✅ Local database connected');
    
    console.log('📡 Testing Render database connection...');
    await renderPrisma.$connect();
    console.log('✅ Render database connected');
    
    // Get all data from local database
    console.log('📥 Exporting data from local database...');
    
    const users = await localPrisma.user.findMany();
    const categories = await localPrisma.category.findMany();
    const products = await localPrisma.product.findMany();
    const orders = await localPrisma.order.findMany();
    const orderItems = await localPrisma.orderItem.findMany();
    const reviews = await localPrisma.review.findMany();
    const vendors = await localPrisma.vendor.findMany();
    const subscriptions = await localPrisma.subscription.findMany();
    
    console.log(`📊 Found ${users.length} users, ${categories.length} categories, ${products.length} products, ${orders.length} orders`);
    
    // Clear existing data in Render database (optional - be careful!)
    console.log('🗑️ Clearing existing data in Render database...');
    await renderPrisma.orderItem.deleteMany();
    await renderPrisma.review.deleteMany();
    await renderPrisma.order.deleteMany();
    await renderPrisma.product.deleteMany();
    await renderPrisma.category.deleteMany();
    await renderPrisma.subscription.deleteMany();
    await renderPrisma.vendor.deleteMany();
    await renderPrisma.user.deleteMany();
    
    // Import data to Render database
    console.log('📤 Importing data to Render database...');
    
    if (users.length > 0) {
      await renderPrisma.user.createMany({ data: users });
      console.log(`✅ Imported ${users.length} users`);
    }
    
    if (vendors.length > 0) {
      await renderPrisma.vendor.createMany({ data: vendors });
      console.log(`✅ Imported ${vendors.length} vendors`);
    }
    
    if (categories.length > 0) {
      await renderPrisma.category.createMany({ data: categories });
      console.log(`✅ Imported ${categories.length} categories`);
    }
    
    if (products.length > 0) {
      await renderPrisma.product.createMany({ data: products });
      console.log(`✅ Imported ${products.length} products`);
    }
    
    if (orders.length > 0) {
      await renderPrisma.order.createMany({ data: orders });
      console.log(`✅ Imported ${orders.length} orders`);
    }
    
    if (orderItems.length > 0) {
      await renderPrisma.orderItem.createMany({ data: orderItems });
      console.log(`✅ Imported ${orderItems.length} order items`);
    }
    
    if (reviews.length > 0) {
      await renderPrisma.review.createMany({ data: reviews });
      console.log(`✅ Imported ${reviews.length} reviews`);
    }
    
    if (subscriptions.length > 0) {
      await renderPrisma.subscription.createMany({ data: subscriptions });
      console.log(`✅ Imported ${subscriptions.length} subscriptions`);
    }
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPrisma.$disconnect();
    await renderPrisma.$disconnect();
  }
}

migrateData();
