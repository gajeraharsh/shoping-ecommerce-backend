/**
 * Rating Service
 * Contains business logic for product rating operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');

/**
 * Create a new product rating
 * @param {number} userId - User ID
 * @param {Object} ratingData - Rating data
 * @returns {Object} Created rating
 */
const createRating = async (userId, ratingData) => {
  const { productId, rating, comment } = ratingData;

  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if user has already rated this product
  const existingRating = await prisma.productRating.findFirst({
    where: {
      userId: Number(userId),
      productId: Number(productId),
      ...notDeletedWhere()
    }
  });

  if (existingRating) {
    throw new Error('You have already rated this product');
  }

  // Verify user has purchased this product (optional business rule)
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: {
        userId: Number(userId),
        status: 'COMPLETED',
        ...notDeletedWhere()
      }
    }
  });

  if (!hasPurchased) {
    throw new Error('You can only rate products you have purchased');
  }

  return await prisma.productRating.create({
    data: {
      userId: Number(userId),
      productId: Number(productId),
      rating: Number(rating),
      comment: comment || null
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      product: {
        select: { id: true, name: true, slug: true }
      }
    }
  });
};

/**
 * Get ratings for a product with pagination
 * @param {string} productId - Product ID
 * @param {Object} query - Query parameters
 * @returns {Object} Ratings with metadata
 */
const getProductRatings = async (productId, query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    rating: ratingFilter
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const where = { 
    productId: Number(productId),
    ...notDeletedWhere() 
  };

  if (ratingFilter) {
    where.rating = Number(ratingFilter);
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [ratings, total, avgRating] = await Promise.all([
    prisma.productRating.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.productRating.count({ where }),
    prisma.productRating.aggregate({
      where: { productId: Number(productId), ...notDeletedWhere() },
      _avg: { rating: true },
      _count: { rating: true }
    })
  ]);

  return {
    data: ratings,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating || 0
    }
  };
};

/**
 * Get user's ratings with pagination
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Object} Ratings with metadata
 */
const getUserRatings = async (userId, query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc'
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { 
    userId: Number(userId),
    ...notDeletedWhere() 
  };

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [ratings, total] = await Promise.all([
    prisma.productRating.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true },
          include: {
            ProductImage: {
              take: 1,
              orderBy: { position: 'asc' }
            }
          }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.productRating.count({ where })
  ]);

  return {
    data: ratings,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get rating by ID
 * @param {string} id - Rating ID
 * @param {Object} user - User object
 * @returns {Object|null} Rating or null
 */
const getRatingById = async (id, user) => {
  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only see their own ratings
  if (user.role !== 'ADMIN') {
    where.userId = user.id;
  }

  return await prisma.productRating.findFirst({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      product: {
        select: { id: true, name: true, slug: true }
      }
    }
  });
};

/**
 * Update rating by ID
 * @param {string} id - Rating ID
 * @param {number} userId - User ID
 * @param {Object} updateData - Update data
 * @param {string} userRole - User role
 * @returns {Object} Updated rating
 */
const updateRating = async (id, userId, updateData, userRole) => {
  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only update their own ratings
  if (userRole !== 'ADMIN') {
    where.userId = Number(userId);
  }

  const existingRating = await prisma.productRating.findFirst({ where });

  if (!existingRating) {
    throw new Error('Rating not found');
  }

  const updatePayload = {};
  if (updateData.rating !== undefined) updatePayload.rating = Number(updateData.rating);
  if (updateData.comment !== undefined) updatePayload.comment = updateData.comment;

  return await prisma.productRating.update({
    where: { id: Number(id) },
    data: updatePayload,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      product: {
        select: { id: true, name: true, slug: true }
      }
    }
  });
};

/**
 * Soft delete rating by ID
 * @param {string} id - Rating ID
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 */
const deleteRating = async (id, userId, userRole) => {
  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only delete their own ratings
  if (userRole !== 'ADMIN') {
    where.userId = Number(userId);
  }

  const rating = await prisma.productRating.findFirst({ where });

  if (!rating) {
    throw new Error('Rating not found');
  }

  await markDeleted('productRating', id, prisma);
};

module.exports = {
  createRating,
  getProductRatings,
  getUserRatings,
  getRatingById,
  updateRating,
  deleteRating
};
