/**
 * Order Service
 * Contains business logic for order operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');

/**
 * Create a new order (checkout process)
 * @param {number} userId - User ID
 * @param {Object} orderData - Order data
 * @returns {Object} Created order
 */
const createOrder = async (userId, orderData) => {
  const { items, addressId, email, phone, discountId } = orderData;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Verify address exists and belongs to user
  const address = await prisma.address.findFirst({
    where: { 
      id: Number(addressId), 
      userId: Number(userId),
      ...notDeletedWhere() 
    }
  });

  if (!address) {
    throw new Error('Address not found or does not belong to user');
  }

  // Verify discount if provided
  let discount = null;
  if (discountId) {
    discount = await prisma.discount.findFirst({
      where: { 
        id: Number(discountId), 
        isActive: true,
        ...notDeletedWhere() 
      }
    });

    if (!discount) {
      throw new Error('Discount not found or inactive');
    }

    // Check discount validity
    const now = new Date();
    if (discount.validFrom && now < discount.validFrom) {
      throw new Error('Discount not yet valid');
    }
    if (discount.validTo && now > discount.validTo) {
      throw new Error('Discount has expired');
    }
  }

  return await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const orderItems = [];

    // Process each item and calculate total
    for (const item of items) {
      const { productId, variantId, quantity } = item;

      // Get product and variant
      const product = await tx.product.findFirst({
        where: { id: Number(productId), ...notDeletedWhere() }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const variant = await tx.productVariant.findFirst({
        where: { 
          id: Number(variantId), 
          productId: Number(productId),
          ...notDeletedWhere() 
        }
      });

      if (!variant) {
        throw new Error(`Product variant ${variantId} not found`);
      }

      // Check stock availability
      if (variant.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.name} - ${variant.size || variant.color || 'variant'}`);
      }

      const itemPrice = variant.discountedPrice || variant.price;
      const itemTotal = itemPrice * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: Number(productId),
        variantId: Number(variantId),
        quantity: Number(quantity),
        price: itemPrice
      });

      // Decrease stock
      await tx.productVariant.update({
        where: { id: Number(variantId) },
        data: { stock: { decrement: quantity } }
      });
    }

    // Apply discount if applicable
    let discountAmount = 0;
    if (discount) {
      if (discount.type === 'PERCENTAGE') {
        discountAmount = (totalAmount * discount.value) / 100;
      } else if (discount.type === 'FIXED') {
        discountAmount = Math.min(discount.value, totalAmount);
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Create order
    const order = await tx.order.create({
      data: {
        userId: Number(userId),
        totalAmount: finalAmount,
        addressId: Number(addressId),
        email,
        phone,
        discountId: discountId ? Number(discountId) : null,
        status: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        Discount: true
      }
    });

    // Create order status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        note: 'Order created'
      }
    });

    return order;
  });
};

/**
 * Get user's orders with pagination
 * @param {number} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Object} Orders with metadata
 */
const getUserOrders = async (userId, query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    status
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { 
    userId: Number(userId), 
    ...notDeletedWhere() 
  };

  if (status) {
    where.status = status;
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        Discount: true
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.order.count({ where })
  ]);

  return {
    data: orders,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get all orders (Admin only)
 * @param {Object} query - Query parameters
 * @returns {Object} Orders with metadata
 */
const getAllOrders = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    status,
    userId
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { ...notDeletedWhere() };

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.userId = Number(userId);
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        Discount: true
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.order.count({ where })
  ]);

  return {
    data: orders,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @param {Object} user - User object
 * @returns {Object|null} Order or null
 */
const getOrderById = async (id, user) => {
  const where = { 
    id: Number(id), 
    ...notDeletedWhere() 
  };

  // Non-admin users can only see their own orders
  if (user.role !== 'ADMIN') {
    where.userId = user.id;
  }

  return await prisma.order.findFirst({
    where,
    include: {
      items: {
        include: {
          product: true,
          variant: true
        }
      },
      address: true,
      user: {
        select: { id: true, name: true, email: true }
      },
      Discount: true,
      OrderStatusHistory: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
};

/**
 * Update order status (Admin only)
 * @param {string} id - Order ID
 * @param {string} status - New status
 * @param {string} note - Optional note
 * @returns {Object} Updated order
 */
const updateOrderStatus = async (id, status, note) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: Number(id),
        status,
        note: note || `Status changed to ${status}`
      }
    });

    return updatedOrder;
  });
};

/**
 * Cancel order
 * @param {string} id - Order ID
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @returns {Object} Updated order
 */
const cancelOrder = async (id, userId, userRole) => {
  const where = { 
    id: Number(id), 
    ...notDeletedWhere() 
  };

  // Non-admin users can only cancel their own orders
  if (userRole !== 'ADMIN') {
    where.userId = userId;
  }

  const order = await prisma.order.findFirst({
    where,
    include: { items: true }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed order');
  }

  if (order.status === 'CANCELLED') {
    throw new Error('Order is already cancelled');
  }

  return await prisma.$transaction(async (tx) => {
    // Restore stock for all items
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } }
      });
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: Number(id),
        status: 'CANCELLED',
        note: 'Order cancelled'
      }
    });

    return updatedOrder;
  });
};

/**
 * Soft delete order (Admin only)
 * @param {string} id - Order ID
 */
const deleteOrder = async (id) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  await markDeleted('order', id, prisma);
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
};
