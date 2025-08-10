/**
 * User Service
 * Handles user-related business logic and database operations
 */

const bcrypt = require('bcrypt');
const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted, withDeletedWhere } = require('../../utils/softDelete');
const { AppError } = require('../../middlewares/errorHandler');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');
const { logger, auditLog } = require('../../utils/logger');

/**
 * Get user profile
 * @param {number} userId - User ID
 * @returns {Object} User profile
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: notDeletedWhere({ id: userId }),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Profile update data
 * @returns {Object} Updated user profile
 */
const updateProfile = async (userId, updateData) => {
  const { name, email } = updateData;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
        isDeleted: false
      }
    });

    if (existingUser) {
      throw new AppError(MESSAGES.DUPLICATE_EMAIL, HTTP_STATUS.CONFLICT);
    }
  }

  const updatedUser = await prisma.user.update({
    where: notDeletedWhere({ id: userId }),
    data: { name, email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  auditLog('PROFILE_UPDATED', userId, updateData);
  logger.info(`Profile updated for user: ${updatedUser.email}`);

  return updatedUser;
};

/**
 * Get all users (admin only)
 * @param {Object} filters - Query filters
 * @returns {Object} Paginated users list
 */
const getUsers = async (filters) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role,
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
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (role) {
    where.role = role;
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true,
      deletedAt: true
    },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit
  });

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user by ID (admin only)
 * @param {number} userId - User ID
 * @param {boolean} includeDeleted - Include deleted users
 * @returns {Object} User details
 */
const getUserById = async (userId, includeDeleted = false) => {
  const user = await prisma.user.findUnique({
    where: withDeletedWhere({ id: userId }, includeDeleted),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true,
      deletedAt: true,
      orders: {
        where: notDeletedWhere(),
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: {
        select: {
          orders: { where: notDeletedWhere() },
          ProductRating: { where: notDeletedWhere() }
        }
      }
    }
  });

  if (!user) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Update user (admin only)
 * @param {number} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated user
 */
const updateUser = async (userId, updateData) => {
  const { name, email, role } = updateData;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
        isDeleted: false
      }
    });

    if (existingUser) {
      throw new AppError(MESSAGES.DUPLICATE_EMAIL, HTTP_STATUS.CONFLICT);
    }
  }

  const updatedUser = await prisma.user.update({
    where: notDeletedWhere({ id: userId }),
    data: { name, email, role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  auditLog('USER_UPDATED', userId, updateData);
  logger.info(`User updated by admin: ${updatedUser.email}`);

  return updatedUser;
};

/**
 * Delete user (admin only)
 * @param {number} userId - User ID
 * @returns {Object} Success message
 */
const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: notDeletedWhere({ id: userId })
  });

  if (!user) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  await markDeleted('user', userId, prisma);

  auditLog('USER_DELETED', userId, { email: user.email });
  logger.info(`User soft deleted: ${user.email}`);

  return { message: MESSAGES.DELETED };
};

module.exports = {
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
