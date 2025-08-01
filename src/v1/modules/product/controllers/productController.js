const prisma = require('../../../../config/database');
const { generateUniqueSlug } = require('../../../../utils/slugify');
const { createProductSchema, updateProductSchema } = require('../../../../validations/product');

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, name_asc, name_desc, rating_desc, newest]
 *       - in: query
 *         name: colors
 *         schema:
 *           type: string
 *       - in: query
 *         name: sizes
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
const getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { 
    search, 
    category, 
    brand, 
    featured, 
    minPrice, 
    maxPrice, 
    sortBy,
    colors,
    sizes,
    isNew,
    isTrending
  } = req.query;

  // Build where condition
  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(category && { category: { slug: category } }),
    ...(brand && { brand: { slug: brand } }),
    ...(featured && { isFeatured: featured === 'true' }),
    ...(isNew && { isNew: isNew === 'true' }),
    ...(isTrending && { isTrending: isTrending === 'true' }),
    ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
    ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
  };

  // Build orderBy
  let orderBy = { createdAt: 'desc' };
  if (sortBy) {
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'rating_desc':
        orderBy = { createdAt: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: true,
        _count: {
          select: { reviews: true }
        }
      },
      skip,
      take: limit,
      orderBy
    }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
const getFeaturedProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true
    },
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { products }
  });
};

/**
 * @swagger
 * /api/v1/products/new:
 *   get:
 *     summary: Get new products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: New products retrieved successfully
 */
const getNewProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isNew: true
    },
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { products }
  });
};

/**
 * @swagger
 * /api/v1/products/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Trending products retrieved successfully
 */
const getTrendingProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isTrending: true
    },
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { products }
  });
};

/**
 * @swagger
 * /api/v1/products/recommendations:
 *   get:
 *     summary: Get product recommendations
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Product recommendations retrieved successfully
 */
const getProductRecommendations = async (req, res) => {
  const { productId, categoryId } = req.query;
  const limit = parseInt(req.query.limit) || 4;

  let where = {
    isActive: true,
    id: { not: productId }
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      brand: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { products }
  });
};

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Search products with advanced filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
const searchProducts = async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const where = {
    isActive: true,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      { brand: { name: { contains: q, mode: 'insensitive' } } }
    ]
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
const getProductBySlug = async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: { product }
  });
};

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Product created successfully
 */
const createProduct = async (req, res) => {
  const validatedData = createProductSchema.parse(req.body);

  // Generate unique slug
  const slug = await generateUniqueSlug(validatedData.name, prisma.product);

  const product = await prisma.product.create({
    data: {
      ...validatedData,
      slug
    },
    include: {
      category: true,
      brand: true,
      images: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
};

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const validatedData = updateProductSchema.parse(req.body);

  // If name is being updated, generate new slug
  let updateData = { ...validatedData };
  if (validatedData.name) {
    updateData.slug = await generateUniqueSlug(validatedData.name, prisma.product);
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      brand: true,
      images: true
    }
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
};

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
};

/**
 * @swagger
 * /api/v1/products/variants:
 *   get:
 *     summary: Get all product variants (sizes, colors)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product variants retrieved successfully
 */
const getProductVariants = async (req, res) => {
  const { productId } = req.query;

  const where = {};
  if (productId) {
    where.productId = productId;
  }

  const variants = await prisma.productVariant.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: [
      { name: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group variants by name (size, color, etc.)
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = [];
    }
    acc[variant.name].push(variant);
    return acc;
  }, {});

  res.json({
    success: true,
    data: { variants: groupedVariants }
  });
};

/**
 * @swagger
 * /api/v1/products/recently-viewed:
 *   get:
 *     summary: Get recently viewed products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Recently viewed products retrieved successfully
 */
const getRecentlyViewedProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const recentlyViewed = await prisma.recentlyViewed.findMany({
    where: {
      userId,
      product: { isActive: true }
    },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { reviews: true }
          }
        }
      }
    },
    orderBy: { viewedAt: 'desc' },
    take: limit
  });

  const products = recentlyViewed.map(rv => rv.product);

  res.json({
    success: true,
    data: { products }
  });
};

/**
 * @swagger
 * /api/v1/products/{productId}/view:
 *   post:
 *     summary: Mark product as viewed
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product marked as viewed successfully
 */
const markProductAsViewed = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Upsert recently viewed record
  await prisma.recentlyViewed.upsert({
    where: {
      userId_productId: {
        userId,
        productId
      }
    },
    update: {
      viewedAt: new Date()
    },
    create: {
      userId,
      productId
    }
  });

  res.json({
    success: true,
    message: 'Product marked as viewed'
  });
};

/**
 * @swagger
 * /api/v1/products/filters:
 *   get:
 *     summary: Get available filters for products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product filters retrieved successfully
 */
const getProductFilters = async (req, res) => {
  const [categories, brands, priceRanges] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true }
    })
  ]);

  // Generate price ranges
  const minPrice = priceRanges._min.price || 0;
  const maxPrice = priceRanges._max.price || 10000;
  
  const priceRangesList = [
    { value: '', label: 'All Prices' },
    { value: `0-999`, label: 'Under ₹999' },
    { value: `1000-1999`, label: '₹1000 - ₹1999' },
    { value: `2000-2999`, label: '₹2000 - ₹2999' },
    { value: `3000-4999`, label: '₹3000 - ₹4999' },
    { value: `5000-${maxPrice}`, label: 'Above ₹5000' }
  ];

  // Get unique sizes and colors from variants
  const variants = await prisma.productVariant.findMany({
    where: {
      product: { isActive: true }
    },
    select: { name: true, value: true }
  });

  const sizes = [...new Set(variants.filter(v => v.name === 'Size').map(v => v.value))].sort();
  const colors = [...new Set(variants.filter(v => v.name === 'Color').map(v => v.value))].sort();

  res.json({
    success: true,
    data: {
      categories,
      brands,
      priceRanges: priceRangesList,
      sizes,
      colors,
      priceRange: {
        min: minPrice,
        max: maxPrice
      }
    }
  });
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 12, sort = 'newest', minPrice, maxPrice, brands, sizes, colors } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where = {
      isActive: true,
      category: {
        slug: categorySlug,
        isActive: true
      }
    };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (brands) {
      where.brand = {
        slug: { in: brands.split(',') }
      };
    }

    // Build sort conditions
    let orderBy = {};
    switch (sort) {
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'popular':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Get category info
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        products,
        category,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products by category'
    });
  }
};

// Get products by brand
const getProductsByBrand = async (req, res) => {
  try {
    const { brandSlug } = req.params;
    const { page = 1, limit = 12, sort = 'newest', minPrice, maxPrice, categories } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where = {
      isActive: true,
      brand: {
        slug: brandSlug,
        isActive: true
      }
    };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (categories) {
      where.category = {
        slug: { in: categories.split(',') }
      };
    }

    // Build sort conditions
    let orderBy = {};
    switch (sort) {
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'popular':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Get brand info
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        products,
        brand,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting products by brand:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products by brand'
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      newProducts,
      trendingProducts,
      lowStockProducts,
      outOfStockProducts
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isFeatured: true, isActive: true } }),
      prisma.product.count({ where: { isNew: true, isActive: true } }),
      prisma.product.count({ where: { isTrending: true, isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 10, gt: 0 }, isActive: true } }),
      prisma.product.count({ where: { stock: 0, isActive: true } })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        featuredProducts,
        newProducts,
        trendingProducts,
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    console.error('Error getting product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product statistics'
    });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getNewProducts,
  getTrendingProducts,
  getProductRecommendations,
  searchProducts,
  getProductVariants,
  getRecentlyViewedProducts,
  markProductAsViewed,
  getProductFilters,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  getProductStats
};