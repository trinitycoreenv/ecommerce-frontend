const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ecommerce.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@ecommerce.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
