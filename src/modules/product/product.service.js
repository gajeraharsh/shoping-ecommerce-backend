/**
 * Product Service
 * Contains business logic for product operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');
const { uploadToS3 } = require('../../utils/upload');

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @param {Array} files - Uploaded files
 * @returns {Object} Created product
 */
const createProduct = async (productData, files = []) => {
  const { categoryId, ...data } = productData;

  // Validate categoryId parameter
  if (!categoryId || isNaN(Number(categoryId))) {
    throw new Error('Valid category ID is required');
  }

  const validCategoryId = Number(categoryId);

  // Verify category exists and is not deleted
  const category = await prisma.category.findFirst({
    where: { id: validCategoryId, ...notDeletedWhere() }
  });
  
  if (!category) {
    throw new Error('Category not found or has been deleted');
  }

  // Handle image uploads
  const imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const imageUrl = await uploadToS3(file.buffer, `products/${Date.now()}-${file.originalname}`, file.mimetype);
      imageUrls.push(imageUrl);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Create product
    const product = await tx.product.create({
      data: {
        ...data,
        categoryId: validCategoryId,
        price: parseFloat(data.price),
        discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
        stock: parseInt(data.stock) || 0
      },
      include: {
        category: true,
        ProductImage: true,
        ProductVariant: true
      }
    });

    // Create product images
    if (imageUrls.length > 0) {
      await tx.productImage.createMany({
        data: imageUrls.map((url, index) => ({
          productId: product.id,
          url,
          position: index + 1
        }))
      });
    }

    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        ProductImage: true,
        ProductVariant: true
      }
    });
  });
};

/**
 * Get products with pagination, filtering, and search
 * @param {Object} query - Query parameters
 * @returns {Object} Products with metadata
 */
const getProducts = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    search,
    categoryId,
    minPrice,
    maxPrice,
    inStock
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where = { ...notDeletedWhere() };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categoryId) {
    where.categoryId = Number(categoryId);
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }

  // Build orderBy
  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        ProductImage: true,
        ProductVariant: true,
        _count: {
          select: { ProductRating: true }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.product.count({ where })
  ]);

  return {
    data: products,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product or null
 */
const getProductById = async (id) => {
  // Validate id parameter
  if (!id || isNaN(Number(id))) {
    throw new Error('Invalid product ID');
  }

  return await prisma.product.findFirst({
    where: { id: Number(id), ...notDeletedWhere() },
    include: {
      category: true,
      ProductImage: true,
      ProductVariant: {
        where: notDeletedWhere(),
        include: {
          ProductVarientImage: true
        }
      },
      ProductRating: {
        where: notDeletedWhere(),
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });
};

/**
 * Update product by ID
 * @param {string} id - Product ID
 * @param {Object} updateData - Update data
 * @param {Array} files - New uploaded files
 * @returns {Object} Updated product
 */
const updateProduct = async (id, updateData, files = []) => {
  const { categoryId, ...data } = updateData;

  // Validate id parameter
  if (!id || isNaN(Number(id))) {
    throw new Error('Invalid product ID');
  }

  const productId = Number(id);

  // Verify product exists
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, ...notDeletedWhere() }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Verify category if provided
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: Number(categoryId), ...notDeletedWhere() }
    });
    
    if (!category) {
      throw new Error('Category not found or has been deleted');
    }
  }

  // Handle new image uploads
  const imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const imageUrl = await uploadToS3(file.buffer, `products/${Date.now()}-${file.originalname}`, file.mimetype);
      imageUrls.push(imageUrl);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Update product
    const updatePayload = { ...data };
    if (categoryId) updatePayload.categoryId = Number(categoryId);
    if (data.price) updatePayload.price = parseFloat(data.price);
    if (data.discountedPrice) updatePayload.discountedPrice = parseFloat(data.discountedPrice);
    if (data.stock !== undefined) updatePayload.stock = parseInt(data.stock);

    const product = await tx.product.update({
      where: { id: productId },
      data: updatePayload
    });

    // Add new images if provided
    if (imageUrls.length > 0) {
      const existingImagesCount = await tx.productImage.count({
        where: { productId: productId, ...notDeletedWhere() }
      });

      await tx.productImage.createMany({
        data: imageUrls.map((url, index) => ({
          productId: productId,
          url,
          position: existingImagesCount + index + 1
        }))
      });
    }

    return await tx.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        ProductImage: true,
        ProductVariant: true
      }
    });
  });
};

/**
 * Soft delete product by ID
 * @param {string} id - Product ID
 */
const deleteProduct = async (id) => {
  // Validate id parameter
  if (!id || isNaN(Number(id))) {
    throw new Error('Invalid product ID');
  }

  const product = await prisma.product.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  await markDeleted('product', id, prisma);
};

/**
 * Hard delete product by ID (Admin only)
 * @param {string} id - Product ID
 * @param {string} adminId - Admin user ID for audit
 */
const hardDeleteProduct = async (id, adminId) => {
  const product = await prisma.product.findUnique({
    where: { id: Number(id) }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Log the hard delete action
  console.log(`Hard delete product ${id} by admin ${adminId} at ${new Date().toISOString()}`);

  await prisma.product.delete({
    where: { id: Number(id) }
  });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  hardDeleteProduct
};
