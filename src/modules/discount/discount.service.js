/**
 * Discount Service
 * Contains business logic for discount operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');

/**
 * Create a new discount
 * @param {Object} discountData - Discount data
 * @returns {Object} Created discount
 */
const createDiscount = async (discountData) => {
  const { code, ...data } = discountData;

  // Check if discount code already exists
  const existingDiscount = await prisma.discount.findFirst({
    where: { code, ...notDeletedWhere() }
  });

  if (existingDiscount) {
    throw new Error('Discount code already exists');
  }

  return await prisma.discount.create({
    data: {
      ...data,
      code,
      value: parseFloat(data.value),
      minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
      maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null
    }
  });
};

/**
 * Get discounts with pagination and filtering
 * @param {Object} query - Query parameters
 * @returns {Object} Discounts with metadata
 */
const getDiscounts = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    isActive,
    type
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { ...notDeletedWhere() };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (type) {
    where.type = type;
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.discount.count({ where })
  ]);

  return {
    data: discounts,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get discount by ID
 * @param {string} id - Discount ID
 * @returns {Object|null} Discount or null
 */
const getDiscountById = async (id) => {
  return await prisma.discount.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });
};

/**
 * Validate discount code
 * @param {string} code - Discount code
 * @returns {Object} Valid discount
 */
const validateDiscountCode = async (code) => {
  const discount = await prisma.discount.findFirst({
    where: { 
      code: code.toUpperCase(),
      isActive: true,
      ...notDeletedWhere() 
    }
  });

  if (!discount) {
    throw new Error('Invalid discount code');
  }

  const now = new Date();

  // Check if discount is valid by date
  if (discount.validFrom && now < discount.validFrom) {
    throw new Error('Discount code is not yet valid');
  }

  if (discount.validTo && now > discount.validTo) {
    throw new Error('Discount code has expired');
  }

  // Check usage limit
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    throw new Error('Discount code usage limit exceeded');
  }

  return discount;
};

/**
 * Update discount by ID
 * @param {string} id - Discount ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated discount
 */
const updateDiscount = async (id, updateData) => {
  const { code, ...data } = updateData;

  // Verify discount exists
  const existingDiscount = await prisma.discount.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!existingDiscount) {
    throw new Error('Discount not found');
  }

  // Check if new code conflicts with existing ones
  if (code && code !== existingDiscount.code) {
    const codeExists = await prisma.discount.findFirst({
      where: { 
        code,
        id: { not: Number(id) },
        ...notDeletedWhere() 
      }
    });

    if (codeExists) {
      throw new Error('Discount code already exists');
    }
  }

  const updatePayload = { ...data };
  if (code) updatePayload.code = code;
  if (data.value) updatePayload.value = parseFloat(data.value);
  if (data.minOrderAmount) updatePayload.minOrderAmount = parseFloat(data.minOrderAmount);
  if (data.maxDiscountAmount) updatePayload.maxDiscountAmount = parseFloat(data.maxDiscountAmount);
  if (data.usageLimit) updatePayload.usageLimit = parseInt(data.usageLimit);
  if (data.validFrom) updatePayload.validFrom = new Date(data.validFrom);
  if (data.validTo) updatePayload.validTo = new Date(data.validTo);

  return await prisma.discount.update({
    where: { id: Number(id) },
    data: updatePayload
  });
};

/**
 * Soft delete discount by ID
 * @param {string} id - Discount ID
 */
const deleteDiscount = async (id) => {
  const discount = await prisma.discount.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!discount) {
    throw new Error('Discount not found');
  }

  await markDeleted('discount', id, prisma);
};

/**
 * Apply discount to order (internal function)
 * @param {Object} discount - Discount object
 * @param {number} orderAmount - Order amount
 * @returns {number} Discount amount
 */
const calculateDiscountAmount = (discount, orderAmount) => {
  if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
    throw new Error(`Minimum order amount of ${discount.minOrderAmount} required for this discount`);
  }

  let discountAmount = 0;

  if (discount.type === 'PERCENTAGE') {
    discountAmount = (orderAmount * discount.value) / 100;
  } else if (discount.type === 'FIXED') {
    discountAmount = discount.value;
  }

  // Apply maximum discount limit
  if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
    discountAmount = discount.maxDiscountAmount;
  }

  return Math.min(discountAmount, orderAmount);
};

module.exports = {
  createDiscount,
  getDiscounts,
  getDiscountById,
  validateDiscountCode,
  updateDiscount,
  deleteDiscount,
  calculateDiscountAmount
};
