const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const outDir = path.resolve(process.cwd(), 'data');
  const outFile = path.join(outDir, 'export.json');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_LOCAL } },
  });

  try {
    console.log('Connecting to local DB...');
    await prisma.$connect();
    console.log('Connected. Exporting tables...');

    const payload = {};
    async function safe(name, fn) {
      try {
        console.log(`Exporting ${name}...`);
        payload[name] = await fn();
      } catch (e) {
        console.warn(`Skipping ${name}:`, e.message || e);
        payload[name] = [];
      }
    }

    await safe('users', () => prisma.user.findMany());
    await safe('vendors', () => prisma.vendor.findMany());
    await safe('categories', () => prisma.category.findMany());
    await safe('products', () => prisma.product.findMany());
    await safe('orders', () => prisma.order.findMany());
    await safe('orderItems', () => prisma.orderItem.findMany());
    await safe('reviews', () => prisma.review.findMany());
    await safe('subscriptions', () => prisma.subscription.findMany());

    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`Exported data to ${outFile}`);
  } catch (err) {
    console.error('Failed to export:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();