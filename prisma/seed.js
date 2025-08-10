const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    // 1. Create Users
    console.log('👤 Creating users...');
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@ecommerce.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    const normalUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: userPassword,
        name: 'John Doe',
        role: 'USER',
      },
    });

    // 2. Create Addresses
    console.log('🏠 Creating addresses...');
    const userAddress = await prisma.address.create({
      data: {
        userId: normalUser.id,
        name: 'John Doe',
        phone: '+1234567890',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        isDefault: true,
      },
    });

    // 3. Create Categories
    console.log('📂 Creating categories...');
    const menCategory = await prisma.category.create({
      data: {
        name: 'Men\'s Fashion',
        slug: 'mens-fashion',
      },
    });

    const womenCategory = await prisma.category.create({
      data: {
        name: 'Women\'s Fashion',
        slug: 'womens-fashion',
      },
    });

    const accessoriesCategory = await prisma.category.create({
      data: {
        name: 'Accessories',
        slug: 'accessories',
      },
    });

    // 4. Create Products with Images and Variants
    console.log('🛍️ Creating products...');
    
    // Product 1: Men's T-Shirt
    const mensShirt = await prisma.product.create({
      data: {
        name: 'Premium Cotton T-Shirt',
        sku: 'MTS-001',
        slug: 'premium-cotton-tshirt',
        description: 'Comfortable premium cotton t-shirt for everyday wear',
        price: 29.99,
        discountedPrice: 24.99,
        stock: 100,
        categoryId: menCategory.id,
        tags: ['cotton', 'casual', 'comfortable'],
        descriptionHtml: '<p>Made from 100% premium cotton for ultimate comfort</p>',
        keyfeatures: ['100% Cotton', 'Machine Washable', 'Pre-shrunk'],
        productDetails: { material: 'Cotton', care: 'Machine wash cold' },
        fitguide: { chest: '38-40 inches', length: '28 inches' },
        styleguide: ['Pair with jeans', 'Layer under jacket'],
      },
    });

    // Product Images for Men's T-Shirt
    await prisma.productImage.createMany({
      data: [
        {
          productId: mensShirt.id,
          url: 'https://example.com/images/mens-tshirt-front.jpg',
          alt: 'Men\'s T-Shirt Front View',
          position: 1,
        },
        {
          productId: mensShirt.id,
          url: 'https://example.com/images/mens-tshirt-back.jpg',
          alt: 'Men\'s T-Shirt Back View',
          position: 2,
        },
      ],
    });

    // Product Variants for Men's T-Shirt
    const mensShirtVariantM = await prisma.productVariant.create({
      data: {
        productId: mensShirt.id,
        sku: 'MTS-001-M-BLK',
        size: 'M',
        color: 'Black',
        price: 29.99,
        discountedPrice: 24.99,
        stock: 25,
      },
    });

    const mensShirtVariantL = await prisma.productVariant.create({
      data: {
        productId: mensShirt.id,
        sku: 'MTS-001-L-BLU',
        size: 'L',
        color: 'Blue',
        price: 29.99,
        discountedPrice: 24.99,
        stock: 30,
      },
    });

    // Product 2: Women's Dress
    const womensDress = await prisma.product.create({
      data: {
        name: 'Elegant Summer Dress',
        sku: 'WD-002',
        slug: 'elegant-summer-dress',
        description: 'Beautiful floral summer dress perfect for any occasion',
        price: 79.99,
        discountedPrice: 59.99,
        stock: 50,
        categoryId: womenCategory.id,
        tags: ['dress', 'summer', 'elegant', 'floral'],
        descriptionHtml: '<p>Elegant summer dress with beautiful floral patterns</p>',
        keyfeatures: ['Breathable Fabric', 'Floral Print', 'Comfortable Fit'],
        productDetails: { material: 'Polyester Blend', care: 'Hand wash recommended' },
        fitguide: { bust: '34-36 inches', waist: '28-30 inches', length: '42 inches' },
        styleguide: ['Perfect for summer events', 'Pair with sandals'],
      },
    });

    // Product Images for Women's Dress
    await prisma.productImage.createMany({
      data: [
        {
          productId: womensDress.id,
          url: 'https://example.com/images/womens-dress-front.jpg',
          alt: 'Women\'s Dress Front View',
          position: 1,
        },
        {
          productId: womensDress.id,
          url: 'https://example.com/images/womens-dress-side.jpg',
          alt: 'Women\'s Dress Side View',
          position: 2,
        },
      ],
    });

    // Product Variants for Women's Dress
    const womensDressVariantS = await prisma.productVariant.create({
      data: {
        productId: womensDress.id,
        sku: 'WD-002-S-FLR',
        size: 'S',
        color: 'Floral',
        price: 79.99,
        discountedPrice: 59.99,
        stock: 15,
      },
    });

    // Product 3: Leather Wallet
    const leatherWallet = await prisma.product.create({
      data: {
        name: 'Genuine Leather Wallet',
        sku: 'LW-003',
        slug: 'genuine-leather-wallet',
        description: 'Premium genuine leather wallet with multiple card slots',
        price: 49.99,
        stock: 75,
        categoryId: accessoriesCategory.id,
        tags: ['leather', 'wallet', 'premium', 'accessories'],
        descriptionHtml: '<p>Handcrafted genuine leather wallet</p>',
        keyfeatures: ['Genuine Leather', '8 Card Slots', 'RFID Protection'],
        productDetails: { material: 'Genuine Leather', dimensions: '4.5 x 3.5 inches' },
      },
    });

    // Product 4: Sneakers
    const sneakers = await prisma.product.create({
      data: {
        name: 'Athletic Running Sneakers',
        sku: 'SNK-004',
        slug: 'athletic-running-sneakers',
        description: 'Comfortable athletic sneakers for running and casual wear',
        price: 89.99,
        discountedPrice: 69.99,
        stock: 60,
        categoryId: menCategory.id,
        tags: ['sneakers', 'athletic', 'running', 'comfortable'],
        descriptionHtml: '<p>High-performance athletic sneakers</p>',
        keyfeatures: ['Breathable Mesh', 'Cushioned Sole', 'Lightweight'],
        productDetails: { material: 'Mesh and Synthetic', sole: 'Rubber' },
      },
    });

    // Product 5: Handbag
    const handbag = await prisma.product.create({
      data: {
        name: 'Designer Handbag',
        sku: 'HB-005',
        slug: 'designer-handbag',
        description: 'Stylish designer handbag perfect for any occasion',
        price: 129.99,
        discountedPrice: 99.99,
        stock: 40,
        categoryId: accessoriesCategory.id,
        tags: ['handbag', 'designer', 'stylish', 'accessories'],
        descriptionHtml: '<p>Elegant designer handbag with premium finish</p>',
        keyfeatures: ['Premium Material', 'Multiple Compartments', 'Adjustable Strap'],
        productDetails: { material: 'Synthetic Leather', dimensions: '12 x 8 x 4 inches' },
      },
    });

    // 5. Create Cart for normal user
    console.log('🛒 Creating cart...');
    const userCart = await prisma.cart.create({
      data: {
        userId: normalUser.id,
        addressId: userAddress.id,
      },
    });

    // Create Cart Items
    await prisma.cartItem.createMany({
      data: [
        {
          cartId: userCart.id,
          productId: mensShirt.id,
          variantId: mensShirtVariantM.id,
          quantity: 2,
        },
        {
          cartId: userCart.id,
          productId: womensDress.id,
          variantId: womensDressVariantS.id,
          quantity: 1,
        },
      ],
    });

    // 6. Create Discount
    console.log('💰 Creating discount...');
    const discount = await prisma.discount.create({
      data: {
        code: 'WELCOME10',
        description: 'Welcome discount for new users',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 50,
        usageLimit: 100,
        usedCount: 5,
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // 7. Create Order
    console.log('📦 Creating order...');
    const order = await prisma.order.create({
      data: {
        userId: normalUser.id,
        addressId: userAddress.id,
        email: normalUser.email,
        phone: '+1234567890',
        status: 'COMPLETED',
        total: 74.98, // 24.99 + 49.99
        discountId: discount.id,
      },
    });

    // Create Order Items
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          productId: mensShirt.id,
          variantId: mensShirtVariantM.id,
          quantity: 1,
          price: 24.99,
        },
        {
          orderId: order.id,
          productId: leatherWallet.id,
          variantId: mensShirtVariantL.id, // Using existing variant for simplicity
          quantity: 1,
          price: 49.99,
        },
      ],
    });

    // Create Order Status History
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'COMPLETED',
        note: 'Order completed successfully',
      },
    });

    // 8. Create Wishlist entry
    console.log('❤️ Creating wishlist...');
    await prisma.wishlist.create({
      data: {
        userId: normalUser.id,
        productId: handbag.id,
      },
    });

    // 9. Create Blog Category and Blog Post
    console.log('📝 Creating blog content...');
    const blogCategory = await prisma.blogCategory.create({
      data: {
        name: 'Fashion Tips',
        slug: 'fashion-tips',
      },
    });

    const blogPost = await prisma.blogPost.create({
      data: {
        title: 'Summer Fashion Trends 2024',
        slug: 'summer-fashion-trends-2024',
        excerpt: 'Discover the hottest summer fashion trends for 2024',
        content: 'Summer is here and with it comes exciting new fashion trends. From vibrant colors to comfortable fabrics, this season offers something for everyone. In this post, we explore the top trends that will dominate your wardrobe this summer.',
        coverImage: 'https://example.com/images/summer-trends-cover.jpg',
        tags: ['summer', 'fashion', 'trends', '2024'],
        authorId: normalUser.id,
        categoryId: blogCategory.id,
        published: true,
        publishedAt: new Date(),
      },
    });

    // Create Blog Comment
    await prisma.blogComment.create({
      data: {
        postId: blogPost.id,
        userId: normalUser.id,
        content: 'Great article! I love the summer trend predictions.',
      },
    });

    // 10. Create Instagram Reel
    console.log('📱 Creating Instagram reel...');
    await prisma.instagramReel.create({
      data: {
        title: 'Summer Outfit Ideas',
        description: 'Quick and stylish summer outfit combinations',
        videoUrl: 'https://example.com/videos/summer-outfits.mp4',
        thumbnail: 'https://example.com/images/summer-outfits-thumb.jpg',
        tags: ['summer', 'outfits', 'style', 'fashion'],
        isActive: true,
      },
    });

    // 11. Create Feed Section
    console.log('📰 Creating feed section...');
    await prisma.feedSection.create({
      data: {
        title: 'New Arrivals',
        description: 'Check out our latest fashion arrivals',
        bannerImage: 'https://example.com/images/new-arrivals-banner.jpg',
        linkUrl: '/products/new-arrivals',
        order: 1,
        isActive: true,
      },
    });

    // 12. Create Product Ratings
    console.log('⭐ Creating product ratings...');
    await prisma.productRating.create({
      data: {
        productId: mensShirt.id,
        userId: normalUser.id,
        rating: 5,
        review: 'Excellent quality t-shirt! Very comfortable and fits perfectly.',
      },
    });

    await prisma.productRating.create({
      data: {
        productId: womensDress.id,
        userId: normalUser.id,
        rating: 4,
        review: 'Beautiful dress, perfect for summer occasions. Love the floral pattern!',
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Seeding Summary:
- 👤 Users: 2 (1 admin, 1 user)
- 🏠 Addresses: 1
- 📂 Categories: 3
- 🛍️ Products: 5
- 🎨 Product Variants: 3
- 🖼️ Product Images: 4
- 🛒 Cart: 1 (with 2 items)
- 📦 Orders: 1 (with 2 items)
- 💰 Discounts: 1
- ❤️ Wishlist: 1 entry
- 📝 Blog Categories: 1
- 📄 Blog Posts: 1
- 💬 Blog Comments: 1
- 📱 Instagram Reels: 1
- 📰 Feed Sections: 1
- ⭐ Product Ratings: 2
    `);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
