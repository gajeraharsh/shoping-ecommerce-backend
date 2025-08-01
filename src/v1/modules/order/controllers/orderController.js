const prisma = require('../../../../config/database');
const { generateOrderNumber } = require('../../../../utils/orderNumber');
const { createOrderSchema, updateOrderStatusSchema } = require('../../../../validations/order');

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 */
const createOrder = async (req, res) => {
  const validatedData = createOrderSchema.parse(req.body);
  const { items, addressId, couponCode, notes } = validatedData;

  // Get products and calculate totals
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true }
  });

  if (products.length !== items.length) {
    return res.status(400).json({
      success: false,
      message: 'Some products are not available'
    });
  }

  // Calculate order totals
  let subtotal = 0;
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    const total = product.price * item.quantity;
    subtotal += total;
    
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      total
    };
  });

  let discount = 0;
  let coupon = null;

  // Apply coupon if provided
  if (couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() }
      }
    });

    if (coupon && subtotal >= (coupon.minimumAmount || 0)) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maximumDiscount) {
          discount = Math.min(discount, coupon.maximumDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }
    }
  }

  const taxAmount = 0; // Calculate based on your tax rules
  const shippingFee = subtotal >= 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + taxAmount + shippingFee - discount;

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      addressId,
      subtotal,
      taxAmount,
      shippingFee,
      discount,
      total,
      couponCode: coupon?.code,
      notes,
      items: {
        create: orderItems
      }
    },
    include: {
      items: {
        include: { product: true }
      },
      address: true
    }
  });

  // Update coupon usage
  if (coupon) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });
  }

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
};

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
const getUserOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: { include: { images: { take: 1 } } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where: { userId: req.user.id } })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 */
const getOrderById = async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: {
      items: {
        include: { product: { include: { images: { take: 1 } } } }
      },
      address: true
    }
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: { order }
  });
};

/**
 * @swagger
 * /api/v1/orders/admin:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
const getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status } = req.query;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
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
 *         description: Order status updated successfully
 */
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const validatedData = updateOrderStatusSchema.parse(req.body);

  const order = await prisma.order.update({
    where: { id },
    data: { status: validatedData.status },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } }
    }
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};