/**
 * Category Service
 * Handles category-related business logic and database operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted, withDeletedWhere } = require('../../utils/softDelete');
const { AppError } = require('../../middlewares/errorHandler');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');
const { logger, auditLog } = require('../../utils/logger');

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @returns {Object} Created category
 */
const createCategory = async (categoryData) => {
  const { name, slug } = categoryData;

  // Check if slug already exists
  const existingCategory = await prisma.category.findFirst({
    where: { slug, isDeleted: false }
  });

  if (existingCategory) {
    throw new AppError('Category slug already exists', HTTP_STATUS.CONFLICT);
  }

  const category = await prisma.category.create({
    data: { name, slug },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true
    }
  });

  auditLog('CATEGORY_CREATED', null, { categoryId: category.id, name, slug });
  logger.info(`Category created: ${name}`);

  return category;
};

/**
 * Get all categories
 * @param {Object} filters - Query filters
 * @returns {Object} Paginated categories list
 */
const getCategories = async (filters) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeDeleted = false
  } = filters;

  const skip = (page - 1) * limit;
  
  // Build where clause
  let where = withDeletedWhere({}, includeDeleted);
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get total count
  const total = await prisma.category.count({ where });

  // Get categories with product count
  const categories = await prisma.category.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true,
      deletedAt: true,
      _count: {
        select: {
          products: { where: notDeletedWhere() }
        }
      }
    },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit
  });

  return {
    categories,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get category by ID
 * @param {number} categoryId - Category ID
 * @param {boolean} includeProducts - Include products in response
 * @returns {Object} Category details
 */
const getCategoryById = async (categoryId, includeProducts = false) => {
  const category = await prisma.category.findUnique({
    where: notDeletedWhere({ id: categoryId }),
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      ...(includeProducts && {
        products: {
          where: notDeletedWhere(),
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountedPrice: true,
            stock: true,
            ProductImage: {
              where: notDeletedWhere(),
              select: {
                url: true,
                alt: true
              },
              orderBy: { position: 'asc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }),
      _count: {
        select: {
          products: { where: notDeletedWhere() }
        }
      }
    }
  });

  if (!category) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return category;
};

/**
 * Update category
 * @param {number} categoryId - Category ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated category
 */
const updateCategory = async (categoryId, updateData) => {
  const { name, slug } = updateData;

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: notDeletedWhere({ id: categoryId })
  });

  if (!existingCategory) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Check if slug is already taken by another category
  if (slug && slug !== existingCategory.slug) {
    const slugExists = await prisma.category.findFirst({
      where: {
        slug,
        id: { not: categoryId },
        isDeleted: false
      }
    });

    if (slugExists) {
      throw new AppError('Category slug already exists', HTTP_STATUS.CONFLICT);
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: { name, slug },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true
    }
  });

  auditLog('CATEGORY_UPDATED', null, { categoryId, updateData });
  logger.info(`Category updated: ${updatedCategory.name}`);

  return updatedCategory;
};

/**
 * Delete category
 * @param {number} categoryId - Category ID
 * @returns {Object} Success message
 */
const deleteCategory = async (categoryId) => {
  const category = await prisma.category.findUnique({
    where: notDeletedWhere({ id: categoryId }),
    include: {
      _count: {
        select: {
          products: { where: notDeletedWhere() }
        }
      }
    }
  });

  if (!category) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Check if category has products
  if (category._count.products > 0) {
    throw new AppError('Cannot delete category with existing products', HTTP_STATUS.BAD_REQUEST);
  }

  await markDeleted('category', categoryId, prisma);

  auditLog('CATEGORY_DELETED', null, { categoryId, name: category.name });
  logger.info(`Category soft deleted: ${category.name}`);

  return { message: MESSAGES.DELETED };
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
