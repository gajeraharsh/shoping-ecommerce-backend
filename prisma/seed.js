const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '+1234567890',
      emailVerified: true
    }
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      phone: '+1234567891',
      emailVerified: true
    }
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'kurtis' },
      update: {},
      create: {
        name: 'Kurtis',
        slug: 'kurtis',
        description: 'Beautiful ethnic kurtis for women',
        image: 'https://images.pexels.com/photos/33133599/pexels-photo-33133599.jpeg',
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'dresses' },
      update: {},
      create: {
        name: 'Dresses',
        slug: 'dresses',
        description: 'Elegant dresses for all occasions',
        image: 'https://images.pexels.com/photos/33161433/pexels-photo-33161433.jpeg',
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'ethnic' },
      update: {},
      create: {
        name: 'Ethnic Wear',
        slug: 'ethnic',
        description: 'Traditional ethnic wear collection',
        image: 'https://images.pexels.com/photos/20777203/pexels-photo-20777203.jpeg',
        sortOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { slug: 'tops' },
      update: {},
      create: {
        name: 'Tops',
        slug: 'tops',
        description: 'Stylish tops for casual and formal wear',
        image: 'https://images.pexels.com/photos/3061814/pexels-photo-3061814.jpeg',
        sortOrder: 4
      }
    }),
    prisma.category.upsert({
      where: { slug: 'gowns' },
      update: {},
      create: {
        name: 'Gowns',
        slug: 'gowns',
        description: 'Elegant gowns for special occasions',
        image: 'https://images.pexels.com/photos/33171268/pexels-photo-33171268.jpeg',
        sortOrder: 5
      }
    })
  ]);

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'ethnic-elegance' },
      update: {},
      create: {
        name: 'Ethnic Elegance',
        slug: 'ethnic-elegance',
        description: 'Premium ethnic wear brand',
        logo: 'https://example.com/logo1.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'modern-chic' },
      update: {},
      create: {
        name: 'Modern Chic',
        slug: 'modern-chic',
        description: 'Contemporary fashion brand',
        logo: 'https://example.com/logo2.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'fashion-forward' },
      update: {},
      create: {
        name: 'Fashion Forward',
        slug: 'fashion-forward',
        description: 'Trendsetting fashion brand',
        logo: 'https://example.com/logo3.png'
      }
    })
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'elegant-floral-kurti' },
      update: {},
      create: {
        name: 'Elegant Floral Kurti',
        slug: 'elegant-floral-kurti',
        description: 'Beautiful floral printed kurti perfect for casual and semi-formal occasions. Made with premium cotton fabric for comfort.',
        price: 1299.00,
        comparePrice: 1899.00,
        costPrice: 800.00,
        sku: 'KUR001',
        stockQuantity: 50,
        isActive: true,
        isFeatured: true,
        isNew: false,
        isTrending: true,
        weight: 0.5,
        dimensions: 'Length: 42", Width: 36"',
        categoryId: categories[0].id, // Kurtis
        brandId: brands[0].id, // Ethnic Elegance
        tags: ['ethnic', 'floral', 'cotton', 'casual']
      }
    }),
    prisma.product.upsert({
      where: { slug: 'chic-designer-dress' },
      update: {},
      create: {
        name: 'Chic Designer Dress',
        slug: 'chic-designer-dress',
        description: 'Elegant designer dress with modern cut and premium fabric. Perfect for evening events and special occasions.',
        price: 2199.00,
        comparePrice: 2999.00,
        costPrice: 1200.00,
        sku: 'DRS001',
        stockQuantity: 30,
        isActive: true,
        isFeatured: true,
        isNew: true,
        isTrending: false,
        weight: 0.8,
        dimensions: 'Length: 45", Width: 38"',
        categoryId: categories[1].id, // Dresses
        brandId: brands[1].id, // Modern Chic
        tags: ['designer', 'evening', 'formal', 'premium']
      }
    }),
    prisma.product.upsert({
      where: { slug: 'stylish-casual-top' },
      update: {},
      create: {
        name: 'Stylish Casual Top',
        slug: 'stylish-casual-top',
        description: 'Trendy casual top with modern design. Pairs perfectly with high-waisted jeans or skirts.',
        price: 899.00,
        comparePrice: 1299.00,
        costPrice: 500.00,
        sku: 'TOP001',
        stockQuantity: 75,
        isActive: true,
        isFeatured: false,
        isNew: false,
        isTrending: false,
        weight: 0.3,
        dimensions: 'Length: 28", Width: 32"',
        categoryId: categories[3].id, // Tops
        brandId: brands[1].id, // Modern Chic
        tags: ['casual', 'trendy', 'cotton', 'versatile']
      }
    }),
    prisma.product.upsert({
      where: { slug: 'royal-ethnic-gown' },
      update: {},
      create: {
        name: 'Royal Ethnic Gown',
        slug: 'royal-ethnic-gown',
        description: 'Stunning ethnic gown with intricate embroidery and premium silk fabric. Perfect for weddings and special celebrations.',
        price: 4999.00,
        comparePrice: 6999.00,
        costPrice: 2500.00,
        sku: 'GWN001',
        stockQuantity: 15,
        isActive: true,
        isFeatured: true,
        isNew: false,
        isTrending: true,
        weight: 1.2,
        dimensions: 'Length: 60", Width: 42"',
        categoryId: categories[4].id, // Gowns
        brandId: brands[0].id, // Ethnic Elegance
        tags: ['ethnic', 'gown', 'wedding', 'silk', 'embroidery']
      }
    }),
    prisma.product.upsert({
      where: { slug: 'modern-ethnic-kurti' },
      update: {},
      create: {
        name: 'Modern Ethnic Kurti',
        slug: 'modern-ethnic-kurti',
        description: 'Contemporary ethnic kurti with modern cuts and traditional motifs. Perfect for office and casual wear.',
        price: 1599.00,
        comparePrice: 2299.00,
        costPrice: 900.00,
        sku: 'KUR002',
        stockQuantity: 40,
        isActive: true,
        isFeatured: false,
        isNew: true,
        isTrending: true,
        weight: 0.6,
        dimensions: 'Length: 40", Width: 34"',
        categoryId: categories[0].id, // Kurtis
        brandId: brands[2].id, // Fashion Forward
        tags: ['modern', 'ethnic', 'office', 'casual']
      }
    })
  ]);

  // Create product images
  await Promise.all([
    prisma.productImage.upsert({
      where: { id: 'img1' },
      update: {},
      create: {
        id: 'img1',
        productId: products[0].id,
        url: 'https://images.pexels.com/photos/33133599/pexels-photo-33133599.jpeg',
        alt: 'Elegant Floral Kurti - Front View',
        sortOrder: 1,
        isPrimary: true
      }
    }),
    prisma.productImage.upsert({
      where: { id: 'img2' },
      update: {},
      create: {
        id: 'img2',
        productId: products[0].id,
        url: 'https://images.pexels.com/photos/20777203/pexels-photo-20777203.jpeg',
        alt: 'Elegant Floral Kurti - Back View',
        sortOrder: 2,
        isPrimary: false
      }
    }),
    prisma.productImage.upsert({
      where: { id: 'img3' },
      update: {},
      create: {
        id: 'img3',
        productId: products[1].id,
        url: 'https://images.pexels.com/photos/33161433/pexels-photo-33161433.jpeg',
        alt: 'Chic Designer Dress - Front View',
        sortOrder: 1,
        isPrimary: true
      }
    }),
    prisma.productImage.upsert({
      where: { id: 'img4' },
      update: {},
      create: {
        id: 'img4',
        productId: products[2].id,
        url: 'https://images.pexels.com/photos/3061814/pexels-photo-3061814.jpeg',
        alt: 'Stylish Casual Top - Front View',
        sortOrder: 1,
        isPrimary: true
      }
    }),
    prisma.productImage.upsert({
      where: { id: 'img5' },
      update: {},
      create: {
        id: 'img5',
        productId: products[3].id,
        url: 'https://images.pexels.com/photos/33171268/pexels-photo-33171268.jpeg',
        alt: 'Royal Ethnic Gown - Front View',
        sortOrder: 1,
        isPrimary: true
      }
    }),
    prisma.productImage.upsert({
      where: { id: 'img6' },
      update: {},
      create: {
        id: 'img6',
        productId: products[4].id,
        url: 'https://images.pexels.com/photos/33133599/pexels-photo-33133599.jpeg',
        alt: 'Modern Ethnic Kurti - Front View',
        sortOrder: 1,
        isPrimary: true
      }
    })
  ]);

  // Create product variants
  await Promise.all([
    prisma.productVariant.upsert({
      where: { id: 'var1' },
      update: {},
      create: {
        id: 'var1',
        productId: products[0].id,
        size: 'S',
        color: 'Blue',
        price: 1299.00,
        stockQuantity: 10,
        sku: 'KUR001-S-BLUE'
      }
    }),
    prisma.productVariant.upsert({
      where: { id: 'var2' },
      update: {},
      create: {
        id: 'var2',
        productId: products[0].id,
        size: 'M',
        color: 'Blue',
        price: 1299.00,
        stockQuantity: 15,
        sku: 'KUR001-M-BLUE'
      }
    }),
    prisma.productVariant.upsert({
      where: { id: 'var3' },
      update: {},
      create: {
        id: 'var3',
        productId: products[0].id,
        size: 'L',
        color: 'Blue',
        price: 1299.00,
        stockQuantity: 20,
        sku: 'KUR001-L-BLUE'
      }
    }),
    prisma.productVariant.upsert({
      where: { id: 'var4' },
      update: {},
      create: {
        id: 'var4',
        productId: products[1].id,
        size: 'S',
        color: 'Black',
        price: 2199.00,
        stockQuantity: 8,
        sku: 'DRS001-S-BLACK'
      }
    }),
    prisma.productVariant.upsert({
      where: { id: 'var5' },
      update: {},
      create: {
        id: 'var5',
        productId: products[1].id,
        size: 'M',
        color: 'Black',
        price: 2199.00,
        stockQuantity: 12,
        sku: 'DRS001-M-BLACK'
      }
    })
  ]);

  // Create user addresses
  const addresses = await Promise.all([
    prisma.address.upsert({
      where: { id: 'addr1' },
      update: {},
      create: {
        id: 'addr1',
        userId: user.id,
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '+1234567891',
        isDefault: true
      }
    }),
    prisma.address.upsert({
      where: { id: 'addr2' },
      update: {},
      create: {
        id: 'addr2',
        userId: user.id,
        firstName: 'John',
        lastName: 'Doe',
        address1: '456 Oak Avenue',
        address2: 'Apt 2B',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'USA',
        phone: '+1234567892',
        isDefault: false
      }
    })
  ]);

  // Create banners
  await Promise.all([
    prisma.banner.upsert({
      where: { id: 'banner1' },
      update: {},
      create: {
        id: 'banner1',
        title: 'Summer Collection',
        subtitle: 'Discover our latest summer fashion collection',
        image: 'https://images.pexels.com/photos/33133599/pexels-photo-33133599.jpeg',
        link: '/products?category=summer',
        sortOrder: 1,
        isActive: true
      }
    }),
    prisma.banner.upsert({
      where: { id: 'banner2' },
      update: {},
      create: {
        id: 'banner2',
        title: 'Ethnic Wear Sale',
        subtitle: 'Up to 50% off on ethnic wear',
        image: 'https://images.pexels.com/photos/20777203/pexels-photo-20777203.jpeg',
        link: '/products?category=ethnic',
        sortOrder: 2,
        isActive: true
      }
    })
  ]);

  // Create coupons
  await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10.00,
        minOrderAmount: 1000.00,
        maxDiscount: 500.00,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    }),
    prisma.coupon.upsert({
      where: { code: 'FLAT50' },
      update: {},
      create: {
        code: 'FLAT50',
        type: 'FIXED',
        value: 50.00,
        minOrderAmount: 500.00,
        usageLimit: 200,
        usedCount: 0,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      }
    })
  ]);

  // Create blog posts
  const blogPosts = await Promise.all([
    prisma.blogPost.upsert({
      where: { slug: 'summer-fashion-trends-2024' },
      update: {},
      create: {
        title: 'Summer Fashion Trends 2024',
        slug: 'summer-fashion-trends-2024',
        excerpt: 'Discover the hottest fashion trends for summer 2024',
        content: 'This is a comprehensive guide to summer fashion trends for 2024. From vibrant colors to sustainable fabrics, we cover everything you need to know to stay stylish this season.',
        featuredImage: 'https://images.pexels.com/photos/33133599/pexels-photo-33133599.jpeg',
        author: 'Admin User',
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: 'Summer Fashion Trends 2024 - Complete Guide',
        metaDescription: 'Discover the latest summer fashion trends for 2024. From colors to fabrics, get all the style tips you need.',
        tags: ['summer', 'fashion', 'trends', '2024']
      }
    }),
    prisma.blogPost.upsert({
      where: { slug: 'how-to-style-ethnic-wear' },
      update: {},
      create: {
        title: 'How to Style Ethnic Wear',
        slug: 'how-to-style-ethnic-wear',
        excerpt: 'Learn the art of styling ethnic wear for different occasions',
        content: 'Ethnic wear is versatile and can be styled in many ways. From casual kurtis to elegant gowns, learn how to make the most of your ethnic wardrobe.',
        featuredImage: 'https://images.pexels.com/photos/20777203/pexels-photo-20777203.jpeg',
        author: 'Admin User',
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: 'How to Style Ethnic Wear - Complete Guide',
        metaDescription: 'Learn how to style ethnic wear for different occasions. Tips and tricks for casual and formal ethnic wear.',
        tags: ['ethnic', 'styling', 'fashion', 'tips']
      }
    })
  ]);

  // Create blog comments
  await Promise.all([
    prisma.blogComment.upsert({
      where: { id: 'comment1' },
      update: {},
      create: {
        id: 'comment1',
        blogPostId: blogPosts[0].id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        comment: 'Great article! I love these summer trends.',
        isApproved: true
      }
    }),
    prisma.blogComment.upsert({
      where: { id: 'comment2' },
      update: {},
      create: {
        id: 'comment2',
        blogPostId: blogPosts[1].id,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        comment: 'Very helpful styling tips. Thank you!',
        isApproved: true
      }
    })
  ]);

  // Create notifications
  await Promise.all([
    prisma.notification.upsert({
      where: { id: 'notif1' },
      update: {},
      create: {
        id: 'notif1',
        userId: user.id,
        type: 'MARKETING',
        title: 'Welcome to Our Platform!',
        message: 'Thank you for joining us. Enjoy 10% off on your first order with code WELCOME10.',
        isRead: false
      }
    }),
    prisma.notification.upsert({
      where: { id: 'notif2' },
      update: {},
      create: {
        id: 'notif2',
        userId: user.id,
        type: 'SYSTEM',
        title: 'Account Verified',
        message: 'Your email has been successfully verified.',
        isRead: true
      }
    })
  ]);

  // Create contact submissions
  await Promise.all([
    prisma.contact.upsert({
      where: { id: 'contact1' },
      update: {},
      create: {
        id: 'contact1',
        userId: user.id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Product Inquiry',
        message: 'I would like to know more about your ethnic wear collection.',
        isRead: false
      }
    }),
    prisma.contact.upsert({
      where: { id: 'contact2' },
      update: {},
      create: {
        id: 'contact2',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        subject: 'Order Issue',
        message: 'I have an issue with my recent order #12345.',
        isRead: true
      }
    })
  ]);

  // Create reviews
  await Promise.all([
    prisma.review.upsert({
      where: { id: 'review1' },
      update: {},
      create: {
        id: 'review1',
        userId: user.id,
        productId: products[0].id,
        rating: 5,
        title: 'Excellent Quality',
        comment: 'The kurti is beautiful and the fabric quality is amazing. Perfect fit and comfortable to wear.',
        isVerified: true,
        isActive: true
      }
    }),
    prisma.review.upsert({
      where: { id: 'review2' },
      update: {},
      create: {
        id: 'review2',
        userId: user.id,
        productId: products[1].id,
        rating: 4,
        title: 'Great Design',
        comment: 'Love the design and the dress fits perfectly. The fabric is good quality.',
        isVerified: true,
        isActive: true
      }
    })
  ]);

  // Create recently viewed products
  await Promise.all([
    prisma.recentlyViewed.upsert({
      where: { id: 'recent1' },
      update: {},
      create: {
        id: 'recent1',
        userId: user.id,
        productId: products[0].id
      }
    }),
    prisma.recentlyViewed.upsert({
      where: { id: 'recent2' },
      update: {},
      create: {
        id: 'recent2',
        userId: user.id,
        productId: products[1].id
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log(`👤 Created users: ${admin.email} (admin), ${user.email} (user)`);
  console.log(`📦 Created ${categories.length} categories`);
  console.log(`🏷️ Created ${brands.length} brands`);
  console.log(`🛍️ Created ${products.length} products`);
  console.log(`📝 Created ${blogPosts.length} blog posts`);
  console.log(`📧 Created ${addresses.length} addresses`);
  console.log(`🎫 Created 2 coupons`);
  console.log(`📢 Created 2 notifications`);
  console.log(`📞 Created 2 contact submissions`);
  console.log(`⭐ Created 2 reviews`);
  console.log(`👁️ Created 2 recently viewed products`);
  console.log('\n🔑 Login Credentials:');
  console.log(`Admin: ${admin.email} / admin123`);
  console.log(`User: ${user.email} / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });