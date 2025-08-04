const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PAYMENT_FAILED'])
});

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PAYMENT_FAILED']).optional(),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
  notes: z.string().optional()
});

// Get all orders with pagination and filters
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      paymentStatus = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          address: {
            select: {
              firstName: true,
              lastName: true,
              address1: true,
              address2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    select: { url: true, alt: true }
                  }
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              transactionId: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: {
                  where: { isPrimary: true },
                  select: { url: true, alt: true }
                }
              }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        refunds: {
          orderBy: { createdAt: 'desc' }
        }
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
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = updateOrderStatusSchema.parse(req.body);

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // TODO: Send notification to user about status change
    // await sendOrderStatusNotification(order.user.email, order.id, status);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order details
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateOrderSchema.parse(req.body);

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if order exists and can be cancelled
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['PENDING', 'PROCESSING', 'CONFIRMED'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Start transaction to cancel order and restore inventory
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          notes: reason || 'Order cancelled by admin',
          updatedAt: new Date()
        }
      });

      // Restore inventory for each item
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        });
      }

      return order;
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const stats = await prisma.$transaction([
      // Total orders
      prisma.order.count(),
      // Orders today
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay
          }
        }
      }),
      // Orders this month
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      // Pending orders
      prisma.order.count({ where: { status: 'PENDING' } }),
      // Processing orders
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      // Shipped orders
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      // Delivered orders
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      // Cancelled orders
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      // Total revenue this month
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          status: {
            in: ['CONFIRMED', 'SHIPPED', 'DELIVERED']
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      // Average order value
      prisma.order.aggregate({
        where: {
          status: {
            in: ['CONFIRMED', 'SHIPPED', 'DELIVERED']
          }
        },
        _avg: {
          totalAmount: true
        }
      })
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalOrders: stats[0],
        ordersToday: stats[1],
        ordersThisMonth: stats[2],
        pendingOrders: stats[3],
        processingOrders: stats[4],
        shippedOrders: stats[5],
        deliveredOrders: stats[6],
        cancelledOrders: stats[7],
        revenueThisMonth: stats[8]._sum.totalAmount || 0,
        averageOrderValue: stats[9]._avg.totalAmount || 0,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk update order status
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs array is required'
      });
    }

    if (!['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update orders
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `${result.count} orders updated successfully`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  getOrderStats,
  bulkUpdateOrderStatus
};
