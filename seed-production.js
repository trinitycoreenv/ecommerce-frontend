const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ecommerce.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true
      }
    });
    console.log('✅ Admin user created');
    
    // Create test vendor
    const vendorPassword = await bcrypt.hash('vendor123', 10);
    const vendor = await prisma.user.create({
      data: {
        email: 'vendor@test.com',
        password: vendorPassword,
        name: 'Test Vendor',
        role: 'VENDOR',
        emailVerified: true,
        isActive: true
      }
    });
    console.log('✅ Test vendor created');
    
    // Create test customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await prisma.user.create({
      data: {
        email: 'customer@test.com',
        password: customerPassword,
        name: 'Test Customer',
        role: 'CUSTOMER',
        emailVerified: true,
        isActive: true
      }
    });
    console.log('✅ Test customer created');
    
    // Create sample categories
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and gadgets'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and apparel'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Home improvement and garden supplies'
        }
      })
    ]);
    console.log('✅ Categories created');
    
    // Create sample products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 99.99,
          categoryId: categories[0].id,
          vendorId: vendor.id,
          status: 'APPROVED',
          stock: 50,
          images: ['/wireless-headphones.png']
        }
      }),
      prisma.product.create({
        data: {
          name: 'Smart LED Bulb',
          description: 'WiFi-enabled smart LED bulb with app control',
          price: 24.99,
          categoryId: categories[0].id,
          vendorId: vendor.id,
          status: 'APPROVED',
          stock: 100,
          images: ['/smart-led-bulb.png']
        }
      }),
      prisma.product.create({
        data: {
          name: 'Summer Floral Dress',
          description: 'Beautiful floral summer dress for women',
          price: 49.99,
          categoryId: categories[1].id,
          vendorId: vendor.id,
          status: 'APPROVED',
          stock: 25,
          images: ['/woman-in-floral-summer-dress.png']
        }
      })
    ]);
    console.log('✅ Sample products created');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('👑 Admin: admin@ecommerce.com / admin123');
    console.log('🏪 Vendor: vendor@test.com / vendor123');
    console.log('🛒 Customer: customer@test.com / customer123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
