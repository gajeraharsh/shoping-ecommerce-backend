/**
 * Address Service
 * Contains business logic for address operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');

/**
 * Create a new address
 * @param {number} userId - User ID
 * @param {Object} addressData - Address data
 * @returns {Object} Created address
 */
const createAddress = async (userId, addressData) => {
  const { isDefault, ...data } = addressData;

  return await prisma.$transaction(async (tx) => {
    // If this is set as default, unset other default addresses
    if (isDefault) {
      await tx.address.updateMany({
        where: { 
          userId: Number(userId),
          isDefault: true,
          ...notDeletedWhere()
        },
        data: { isDefault: false }
      });
    }

    return await tx.address.create({
      data: {
        ...data,
        userId: Number(userId),
        isDefault: Boolean(isDefault)
      }
    });
  });
};

/**
 * Get user's addresses
 * @param {number} userId - User ID
 * @returns {Array} User's addresses
 */
const getUserAddresses = async (userId) => {
  return await prisma.address.findMany({
    where: { 
      userId: Number(userId),
      ...notDeletedWhere() 
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });
};

/**
 * Get address by ID
 * @param {string} id - Address ID
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @returns {Object|null} Address or null
 */
const getAddressById = async (id, userId, userRole) => {
  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only see their own addresses
  if (userRole !== 'ADMIN') {
    where.userId = Number(userId);
  }

  return await prisma.address.findFirst({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
};

/**
 * Update address by ID
 * @param {string} id - Address ID
 * @param {number} userId - User ID
 * @param {Object} updateData - Update data
 * @param {string} userRole - User role
 * @returns {Object} Updated address
 */
const updateAddress = async (id, userId, updateData, userRole) => {
  const { isDefault, ...data } = updateData;

  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only update their own addresses
  if (userRole !== 'ADMIN') {
    where.userId = Number(userId);
  }

  const existingAddress = await prisma.address.findFirst({ where });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  return await prisma.$transaction(async (tx) => {
    // If this is set as default, unset other default addresses for the same user
    if (isDefault) {
      await tx.address.updateMany({
        where: { 
          userId: existingAddress.userId,
          id: { not: Number(id) },
          isDefault: true,
          ...notDeletedWhere()
        },
        data: { isDefault: false }
      });
    }

    const updatePayload = { ...data };
    if (isDefault !== undefined) updatePayload.isDefault = Boolean(isDefault);

    return await tx.address.update({
      where: { id: Number(id) },
      data: updatePayload
    });
  });
};

/**
 * Set default address
 * @param {string} id - Address ID
 * @param {number} userId - User ID
 * @returns {Object} Updated address
 */
const setDefaultAddress = async (id, userId) => {
  const address = await prisma.address.findFirst({
    where: { 
      id: Number(id),
      userId: Number(userId),
      ...notDeletedWhere() 
    }
  });

  if (!address) {
    throw new Error('Address not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Unset other default addresses
    await tx.address.updateMany({
      where: { 
        userId: Number(userId),
        id: { not: Number(id) },
        isDefault: true,
        ...notDeletedWhere()
      },
      data: { isDefault: false }
    });

    // Set this address as default
    return await tx.address.update({
      where: { id: Number(id) },
      data: { isDefault: true }
    });
  });
};

/**
 * Soft delete address by ID
 * @param {string} id - Address ID
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 */
const deleteAddress = async (id, userId, userRole) => {
  const where = { 
    id: Number(id),
    ...notDeletedWhere() 
  };

  // Non-admin users can only delete their own addresses
  if (userRole !== 'ADMIN') {
    where.userId = Number(userId);
  }

  const address = await prisma.address.findFirst({ where });

  if (!address) {
    throw new Error('Address not found');
  }

  // Check if this is the default address and user has other addresses
  if (address.isDefault) {
    const otherAddresses = await prisma.address.findMany({
      where: {
        userId: address.userId,
        id: { not: Number(id) },
        ...notDeletedWhere()
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    // If there are other addresses, set the most recent one as default
    if (otherAddresses.length > 0) {
      await prisma.address.update({
        where: { id: otherAddresses[0].id },
        data: { isDefault: true }
      });
    }
  }

  await markDeleted('address', id, prisma);
};

module.exports = {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
