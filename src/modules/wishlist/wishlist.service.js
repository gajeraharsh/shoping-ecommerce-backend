/**
 * Wishlist Service
 * Contains business logic for wishlist operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere } = require('../../utils/softDelete');

/**
 * Get user's wishlist with pagination
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Object} Wishlist with metadata
 */
const getWishlist = async (userId, query) => {
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

  const [wishlistItems, total] = await Promise.all([
    prisma.wishlist.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            ProductImage: true,
            ProductVariant: {
              where: notDeletedWhere()
            }
          }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.wishlist.count({ where })
  ]);

  return {
    data: wishlistItems,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Add product to wishlist
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @returns {Object} Created wishlist item
 */
const addToWishlist = async (userId, productId) => {
  // Verify product exists and is not deleted
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if product is already in wishlist
  const existingItem = await prisma.wishlist.findFirst({
    where: {
      userId: Number(userId),
      productId: Number(productId),
      ...notDeletedWhere()
    }
  });

  if (existingItem) {
    throw new Error('Product is already in wishlist');
  }

  return await prisma.wishlist.create({
    data: {
      userId: Number(userId),
      productId: Number(productId)
    },
    include: {
      product: {
        include: {
          category: true,
          ProductImage: true,
          ProductVariant: {
            where: notDeletedWhere()
          }
        }
      }
    }
  });
};

/**
 * Remove product from wishlist
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 */
const removeFromWishlist = async (userId, productId) => {
  const wishlistItem = await prisma.wishlist.findFirst({
    where: {
      userId: Number(userId),
      productId: Number(productId),
      ...notDeletedWhere()
    }
  });

  if (!wishlistItem) {
    throw new Error('Product not found in wishlist');
  }

  await prisma.wishlist.update({
    where: { id: wishlistItem.id },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

/**
 * Clear user's wishlist
 * @param {number} userId - User ID
 */
const clearWishlist = async (userId) => {
  await prisma.wishlist.updateMany({
    where: { userId: Number(userId) },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
