const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '+1234567890'
    }
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@ecommerce.com' },
    update: {},
    create: {
      email: 'user@ecommerce.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      phone: '+0987654321'
    }
  });

  // Create categories
  const clothingCategory = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion clothing for all occasions'
    }
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Fashion accessories and more'
    }
  });

  // Create brands
  const nikeBrand = await prisma.brand.upsert({
    where: { slug: 'nike' },
    update: {},
    create: {
      name: 'Nike',
      slug: 'nike',
      description: 'Just Do It'
    }
  });

  const adidasBrand = await prisma.brand.upsert({
    where: { slug: 'adidas' },
    update: {},
    create: {
      name: 'Adidas',
      slug: 'adidas',
      description: 'Impossible is Nothing'
    }
  });

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: { slug: 'nike-air-max-90' },
    update: {},
    create: {
      name: 'Nike Air Max 90',
      slug: 'nike-air-max-90',
      description: 'Classic Nike Air Max 90 sneakers with superior comfort',
      price: 129.99,
      comparePrice: 149.99,
      stock: 50,
      sku: 'NIKE-AM90-001',
      categoryId: clothingCategory.id,
      brandId: nikeBrand.id,
      isFeatured: true
    }
  });

  const product2 = await prisma.product.upsert({
    where: { slug: 'adidas-ultraboost-22' },
    update: {},
    create: {
      name: 'Adidas Ultraboost 22',
      slug: 'adidas-ultraboost-22',
      description: 'Revolutionary running shoes with boost technology',
      price: 179.99,
      comparePrice: 199.99,
      stock: 30,
      sku: 'ADIDAS-UB22-001',
      categoryId: clothingCategory.id,
      brandId: adidasBrand.id,
      isFeatured: true
    }
  });

  // Create sample coupon
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off for new customers',
      discountType: 'percentage',
      discountValue: 10,
      minimumAmount: 50,
      usageLimit: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });

  // Create sample banner
  const banner = await prisma.banner.upsert({
    where: { id: 'sample-banner' },
    update: {},
    create: {
      id: 'sample-banner',
      title: 'Summer Sale',
      description: 'Up to 50% off on selected items',
      image: 'https://images.pexels.com/photos/1639729/pexels-photo-1639729.jpeg',
      link: '/products?sale=true',
      sortOrder: 1
    }
  });

  console.log('Database seeded successfully!');
  console.log('Admin user: admin@ecommerce.com / admin123');
  console.log('Regular user: user@ecommerce.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });