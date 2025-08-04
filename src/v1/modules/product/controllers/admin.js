const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const slugify = require('slugify');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  categoryId: z.string(),
  brandId: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).default([])
});

const updateProductSchema = createProductSchema.partial();

const createVariantSchema = z.object({
  name: z.string().min(2).max(100),
  value: z.string().min(1).max(100),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

// Get all products with pagination and filters
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      brandId = '',
      isActive = '',
      isFeatured = '',
      isNew = '',
      isTrending = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isActive !== '') where.isActive = isActive === 'true';
    if (isFeatured !== '') where.isFeatured = isFeatured === 'true';
    if (isNew !== '') where.isNew = isNew === 'true';
    if (isTrending !== '') where.isTrending = isTrending === 'true';

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            select: { id: true, url: true, alt: true, isPrimary: true },
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            select: { id: true, name: true, value: true, price: true, stockQuantity: true }
          },
          _count: {
            select: {
              reviews: true,
              cartItems: true,
              wishlistItems: true,
              orderItems: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            cartItems: true,
            wishlistItems: true,
            orderItems: true
          }
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
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const productData = createProductSchema.parse(req.body);

    // Generate slug
    const baseSlug = slugify(productData.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Check if SKU is unique (if provided)
    if (productData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: productData.sku }
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...productData,
        slug
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: true,
        variants: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateProductSchema.parse(req.body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update slug if name is being changed
    if (updateData.name && updateData.name !== existingProduct.name) {
      const baseSlug = slugify(updateData.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await prisma.product.findFirst({ 
        where: { slug, id: { not: id } } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Check if SKU is unique (if being updated)
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { sku: updateData.sku, id: { not: id } }
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: true,
        variants: true
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images from filesystem
    for (const image of existingProduct.images) {
      try {
        const imagePath = path.join(__dirname, '../../../../../uploads', path.basename(image.url));
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add product images
const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of { url, alt, isPrimary, sortOrder }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // If setting a new primary image, unset existing primary
    if (images.some(img => img.isPrimary)) {
      await prisma.productImage.updateMany({
        where: { productId: id, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    // Create images
    const createdImages = await prisma.productImage.createMany({
      data: images.map(img => ({
        ...img,
        productId: id
      }))
    });

    res.status(201).json({
      success: true,
      message: 'Images added successfully',
      data: createdImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create product variant
const createProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const variantData = createVariantSchema.parse(req.body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if SKU is unique (if provided)
    if (variantData.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: variantData.sku }
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'Variant SKU already exists'
        });
      }
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        ...variantData,
        productId: id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: variant
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total products
      prisma.product.count(),
      // Active products
      prisma.product.count({ where: { isActive: true } }),
      // Featured products
      prisma.product.count({ where: { isFeatured: true } }),
      // Low stock products
      prisma.product.count({
        where: {
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        }
      }),
      // Out of stock products
      prisma.product.count({ where: { stockQuantity: 0 } }),
      // Products created this month
      prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts: stats[0],
        activeProducts: stats[1],
        featuredProducts: stats[2],
        lowStockProducts: stats[3],
        outOfStockProducts: stats[4],
        newProductsThisMonth: stats[5]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk update products
const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    // Update products
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: updateData
    });

    res.json({
      success: true,
      message: `${result.count} products updated successfully`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  createProductVariant,
  getProductStats,
  bulkUpdateProducts
};
