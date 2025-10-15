export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret') || '';
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clear = false,
      users = [],
      vendors = [],
      categories = [],
      products = [],
      orders = [],
      orderItems = [],
      reviews = [],
      subscriptions = [],
    } = body || {};

    const prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL || process.env.DATABASE_URL_RENDER },
      },
    });

    await prisma.$connect();

    if (clear) {
      await prisma.orderItem.deleteMany();
      await prisma.review.deleteMany();
      await prisma.order.deleteMany();
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();
      await prisma.subscription.deleteMany();
      await prisma.vendor.deleteMany();
      await prisma.user.deleteMany();
    }

    const results: Record<string, number> = {};

    if (users.length) {
      const r = await prisma.user.createMany({ data: users });
      results.users = r.count;
    }
    if (vendors.length) {
      const r = await prisma.vendor.createMany({ data: vendors });
      results.vendors = r.count;
    }
    if (categories.length) {
      const r = await prisma.category.createMany({ data: categories });
      results.categories = r.count;
    }
    if (products.length) {
      const r = await prisma.product.createMany({ data: products });
      results.products = r.count;
    }
    if (orders.length) {
      const r = await prisma.order.createMany({ data: orders });
      results.orders = r.count;
    }
    if (orderItems.length) {
      const r = await prisma.orderItem.createMany({ data: orderItems });
      results.orderItems = r.count;
    }
    if (reviews.length) {
      const r = await prisma.review.createMany({ data: reviews });
      results.reviews = r.count;
    }
    if (subscriptions.length) {
      const r = await prisma.subscription.createMany({ data: subscriptions });
      results.subscriptions = r.count;
    }

    await prisma.$disconnect();

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}