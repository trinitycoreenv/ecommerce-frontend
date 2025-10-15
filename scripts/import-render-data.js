const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const file = path.resolve(process.cwd(), 'data', 'export.json');
  if (!fs.existsSync(file)) {
    console.error('data/export.json not found');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_RENDER || process.env.DATABASE_URL } },
  });

  try {
    console.log('Connecting to Render DB...');
    await prisma.$connect();
    console.log('Connected. Clearing and importing data...');

    const has = (model) => typeof prisma[model] !== 'undefined';
    const safe = async (label, fn) => {
      try {
        await fn();
        console.log(`Done: ${label}`);
      } catch (e) {
        console.warn(`Skip ${label}: ${e.message || e}`);
      }
    };

    // Clear with FK-safe order
    if (has('orderItem')) await safe('delete orderItems', () => prisma.orderItem.deleteMany());
    if (has('review')) await safe('delete reviews', () => prisma.review.deleteMany());
    if (has('order')) await safe('delete orders', () => prisma.order.deleteMany());
    if (has('product')) await safe('delete products', () => prisma.product.deleteMany());
    if (has('category')) await safe('delete categories', () => prisma.category.deleteMany());
    if (has('subscription')) await safe('delete subscriptions', () => prisma.subscription.deleteMany());
    if (has('vendor')) await safe('delete vendors', () => prisma.vendor.deleteMany());
    if (has('user')) await safe('delete users', () => prisma.user.deleteMany());

    // Insert with FK-safe order
    if (has('user') && payload.users?.length) await safe('insert users', () => prisma.user.createMany({ data: payload.users }));
    if (has('vendor') && payload.vendors?.length) await safe('insert vendors', () => prisma.vendor.createMany({ data: payload.vendors }));
    if (has('category') && payload.categories?.length) await safe('insert categories', () => prisma.category.createMany({ data: payload.categories }));
    if (has('product') && payload.products?.length) await safe('insert products', () => prisma.product.createMany({ data: payload.products }));
    if (has('order') && payload.orders?.length) await safe('insert orders', () => prisma.order.createMany({ data: payload.orders }));
    if (has('orderItem') && payload.orderItems?.length) await safe('insert orderItems', () => prisma.orderItem.createMany({ data: payload.orderItems }));
    if (has('review') && payload.reviews?.length) await safe('insert reviews', () => prisma.review.createMany({ data: payload.reviews }));
    if (has('subscription') && payload.subscriptions?.length) await safe('insert subscriptions', () => prisma.subscription.createMany({ data: payload.subscriptions }));

    console.log('Import completed (with skips as needed).');
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();