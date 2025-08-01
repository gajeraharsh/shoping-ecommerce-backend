const prisma = require('../../../../config/database');
const { generateUniqueSlug } = require('../../../../utils/slugify');
const { createBrandSchema, updateBrandSchema } = require('../../../../validations/product');

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 */
const getBrands = async (req, res) => {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    }
  });

  res.json({
    success: true,
    data: { brands }
  });
};

/**
 * @swagger
 * /api/v1/brands/{slug}:
 *   get:
 *     summary: Get brand by slug
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *       404:
 *         description: Brand not found
 */
const getBrandBySlug = async (req, res) => {
  const { slug } = req.params;

  const brand = await prisma.brand.findUnique({
    where: { slug, isActive: true },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    }
  });

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  res.json({
    success: true,
    data: { brand }
  });
};

/**
 * @swagger
 * /api/v1/brands/{slug}/products:
 *   get:
 *     summary: Get products by brand
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: slug
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, name_asc, name_desc, rating_desc, newest]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
const getProductsByBrand = async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { sortBy } = req.query;

  // Check if brand exists
  const brand = await prisma.brand.findUnique({
    where: { slug, isActive: true }
  });

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

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
        orderBy = { rating: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        brandId: brand.id,
        isActive: true
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
      skip,
      take: limit,
      orderBy
    }),
    prisma.product.count({
      where: {
        brandId: brand.id,
        isActive: true
      }
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      brand,
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
 * /api/v1/brands:
 *   post:
 *     summary: Create new brand (Admin only)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Brand created successfully
 */
const createBrand = async (req, res) => {
  const validatedData = createBrandSchema.parse(req.body);

  const slug = await generateUniqueSlug(validatedData.name, prisma.brand);

  const brand = await prisma.brand.create({
    data: {
      ...validatedData,
      slug
    }
  });

  res.status(201).json({
    success: true,
    message: 'Brand created successfully',
    data: { brand }
  });
};

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   put:
 *     summary: Update brand (Admin only)
 *     tags: [Brands]
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
 *         description: Brand updated successfully
 */
const updateBrand = async (req, res) => {
  const { id } = req.params;
  const validatedData = updateBrandSchema.parse(req.body);

  // If name is being updated, generate new slug
  let updateData = { ...validatedData };
  if (validatedData.name) {
    updateData.slug = await generateUniqueSlug(validatedData.name, prisma.brand);
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Brand updated successfully',
    data: { brand }
  });
};

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   delete:
 *     summary: Delete brand (Admin only)
 *     tags: [Brands]
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
 *         description: Brand deleted successfully
 */
const deleteBrand = async (req, res) => {
  const { id } = req.params;

  await prisma.brand.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Brand deleted successfully'
  });
};

module.exports = {
  getBrands,
  getBrandBySlug,
  getProductsByBrand,
  createBrand,
  updateBrand,
  deleteBrand
}; 