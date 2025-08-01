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
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      sortBy = 'newest',
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Build filter conditions
    const where = { userId };
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) where.total.gte = parseFloat(minAmount);
      if (maxAmount) where.total.lte = parseFloat(maxAmount);
    }

    // Build sort conditions
    let orderBy = {};
    switch (sortBy) {
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'amount-high':
        orderBy.total = 'desc';
        break;
      case 'amount-low':
        orderBy.total = 'asc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { 
              product: { 
                include: { 
                  images: { 
                    take: 1,
                    orderBy: { sortOrder: 'asc' }
                  } 
                } 
              } 
            }
          },
          address: true,
          payment: true
        },
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    // Get order statistics
    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
      _sum: { total: true }
    });

    const orderStats = {
      total: stats.reduce((sum, stat) => sum + stat._count.status, 0),
      totalSpent: stats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0),
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.status,
          total: stat._sum.total || 0
        };
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: orderStats
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
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
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { 
            product: { 
              include: { 
                images: { 
                  orderBy: { sortOrder: 'asc' }
                } 
              } 
            } 
          }
        },
        address: true,
        payment: true,
        returns: {
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    product: {
                      include: {
                        images: { take: 1 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate detailed timeline
    const timeline = generateDetailedOrderTimeline(order);

    // Check if items can be returned/reviewed
    const itemsWithActions = order.items.map(item => {
      const canReturn = order.status === 'DELIVERED' && 
        new Date() <= new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const canReview = order.status === 'DELIVERED';
      
      return {
        ...item,
        canReturn,
        canReview,
        eligibleUntil: canReturn ? new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) : null
      };
    });

    res.json({
      success: true,
      data: { 
        order: {
          ...order,
          items: itemsWithActions
        },
        timeline
      }
    });
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order details'
    });
  }
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

/**
 * @swagger
 * /api/v1/orders/{id}/track:
 *   get:
 *     summary: Track order status
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
 *         description: Order tracking information retrieved successfully
 */
const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { 
            product: { 
              include: { 
                images: { take: 1 } 
              } 
            } 
          }
        },
        address: true,
        payment: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate detailed tracking information
    const trackingInfo = generateDetailedTrackingInfo(order);

    res.json({
      success: true,
      data: { trackingInfo }
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking information'
    });
  }
};

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
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
 *         description: Order cancelled successfully
 */
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.user.id,
      status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] }
    },
    include: { items: true }
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or cannot be cancelled'
    });
  }

  // Update order status
  await prisma.order.update({
    where: { id },
    data: { 
      status: 'CANCELLED',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer'
    }
  });

  // Restore product stock
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } }
    });
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully'
  });
};

/**
 * @swagger
 * /api/v1/orders/{id}/return:
 *   post:
 *     summary: Request order return
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
 *         description: Return request submitted successfully
 */
const requestReturn = async (req, res) => {
  const { id } = req.params;
  const { reason, items } = req.body;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.user.id,
      status: 'DELIVERED'
    }
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or cannot be returned'
    });
  }

  // Create return request (you might want to add a Return model)
  // For now, we'll just update the order
  await prisma.order.update({
    where: { id },
    data: { 
      status: 'RETURN_REQUESTED',
      notes: `Return requested: ${reason}`
    }
  });

  res.json({
    success: true,
    message: 'Return request submitted successfully'
  });
};

/**
 * @swagger
 * /api/v1/orders/{id}/invoice:
 *   get:
 *     summary: Download order invoice
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
 *         description: Invoice generated successfully
 */
const downloadInvoice = async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: {
      items: {
        include: { product: true }
      },
      address: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Generate invoice data (you might want to use a PDF library)
  const invoiceData = {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    customer: {
      name: `${order.user.firstName} ${order.user.lastName}`,
      email: order.user.email,
      address: order.address
    },
    items: order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total
  };

  res.json({
    success: true,
    data: { invoice: invoiceData }
  });
};

// Generate detailed order timeline
const generateDetailedOrderTimeline = (order) => {
  const timeline = [
    {
      status: 'ORDER_PLACED',
      title: 'Order Placed',
      description: 'Your order has been placed successfully',
      date: order.createdAt,
      completed: true,
      icon: 'shopping-cart'
    }
  ];

  // Add payment confirmation
  if (order.paymentStatus === 'PAID') {
    timeline.push({
      status: 'PAYMENT_CONFIRMED',
      title: 'Payment Confirmed',
      description: 'Payment has been processed successfully',
      date: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000),
      completed: true,
      icon: 'credit-card'
    });
  }

  // Add order confirmation
  if (order.status !== 'PENDING') {
    timeline.push({
      status: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed',
      date: new Date(order.createdAt.getTime() + 4 * 60 * 60 * 1000),
      completed: true,
      icon: 'check-circle'
    });
  }

  // Add processing
  if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    timeline.push({
      status: 'PROCESSING',
      title: 'Processing',
      description: 'Your order is being processed',
      date: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
      completed: true,
      icon: 'package'
    });
  }

  // Add shipped
  if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
    timeline.push({
      status: 'SHIPPED',
      title: 'Shipped',
      description: order.trackingNumber 
        ? `Your order has been shipped. Tracking: ${order.trackingNumber}`
        : 'Your order has been shipped',
      date: new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000),
      completed: true,
      icon: 'truck'
    });
  }

  // Add out for delivery
  if (order.status === 'DELIVERED') {
    timeline.push({
      status: 'OUT_FOR_DELIVERY',
      title: 'Out for Delivery',
      description: 'Your order is out for delivery',
      date: new Date(order.createdAt.getTime() + 72 * 60 * 60 * 1000),
      completed: true,
      icon: 'map-pin'
    });
  }

  // Add delivered
  if (order.status === 'DELIVERED') {
    timeline.push({
      status: 'DELIVERED',
      title: 'Delivered',
      description: 'Order delivered successfully',
      date: order.estimatedDelivery || new Date(order.createdAt.getTime() + 96 * 60 * 60 * 1000),
      completed: true,
      icon: 'check-circle'
    });
  }

  // Add cancelled if applicable
  if (order.status === 'CANCELLED') {
    timeline.push({
      status: 'CANCELLED',
      title: 'Cancelled',
      description: 'Order has been cancelled',
      date: order.updatedAt,
      completed: true,
      icon: 'x-circle'
    });
  }

  return timeline;
};

// Generate detailed tracking information
const generateDetailedTrackingInfo = (order) => {
  const courierInfo = {
    name: order.trackingNumber ? 'BlueDart' : 'Standard Delivery',
    phone: '1800-123-4567',
    email: 'support@courier.com',
    website: 'https://courier.com'
  };

  const shipmentDetails = {
    weight: `${order.items.length * 0.5} kg`,
    dimensions: '30 x 25 x 5 cm',
    value: order.total,
    items: order.items.length
  };

  const deliveryAddress = {
    name: `${order.address.firstName} ${order.address.lastName}`,
    address: `${order.address.address1}${order.address.address2 ? ', ' + order.address.address2 : ''}`,
    city: order.address.city,
    state: order.address.state,
    pincode: order.address.postalCode,
    country: order.address.country,
    phone: order.address.phone
  };

  const trackingTimeline = generateDetailedTrackingTimeline(order);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber || `TRK${Date.now()}`,
    estimatedDelivery: order.estimatedDelivery,
    courier: courierInfo,
    shipmentDetails,
    deliveryAddress,
    timeline: trackingTimeline
  };
};

// Generate detailed tracking timeline
const generateDetailedTrackingTimeline = (order) => {
  const timeline = [
    {
      status: 'ORDER_PICKED_UP',
      title: 'Order Picked Up',
      location: 'Warehouse',
      date: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
      description: 'Package picked up from seller',
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      status: 'IN_TRANSIT',
      title: 'In Transit',
      location: 'Sorting Facility',
      date: new Date(order.createdAt.getTime() + 36 * 60 * 60 * 1000),
      description: 'Package processed at sorting facility',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      status: 'IN_TRANSIT',
      title: 'In Transit',
      location: 'Hub',
      date: new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000),
      description: 'Package departed from origin hub',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      status: 'IN_TRANSIT',
      title: 'In Transit',
      location: 'Destination Facility',
      date: new Date(order.createdAt.getTime() + 60 * 60 * 60 * 1000),
      description: 'Package arrived at destination facility',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      status: 'OUT_FOR_DELIVERY',
      title: 'Out for Delivery',
      location: 'Local Office',
      date: new Date(order.createdAt.getTime() + 72 * 60 * 60 * 1000),
      description: 'Package is out for delivery',
      completed: order.status === 'DELIVERED'
    },
    {
      status: 'DELIVERED',
      title: 'Delivered',
      location: 'Customer Address',
      date: order.estimatedDelivery || new Date(order.createdAt.getTime() + 96 * 60 * 60 * 1000),
      description: 'Package delivered successfully',
      completed: order.status === 'DELIVERED'
    }
  ];

  return timeline;
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  cancelOrder,
  requestReturn,
  downloadInvoice
};