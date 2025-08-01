const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user returns
const getUserReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Build filter conditions
    const where = { userId };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      images: { take: 1 }
                    }
                  }
                }
              }
            }
          },
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
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.return.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        returns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get returns'
    });
  }
};

// Get return by ID
const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnData = await prisma.return.findFirst({
      where: { id, userId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: true
                  }
                }
              }
            },
            address: true
          }
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  include: {
                    images: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    // Generate timeline based on status
    const timeline = generateReturnTimeline(returnData);

    res.json({
      success: true,
      data: {
        return: returnData,
        timeline
      }
    });
  } catch (error) {
    console.error('Error getting return by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get return details'
    });
  }
};

// Create return request
const createReturn = async (req, res) => {
  try {
    const { orderId, type, reason, description, items } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user and is eligible for return
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'DELIVERED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for return'
      });
    }

    // Check if return already exists
    const existingReturn = await prisma.return.findFirst({
      where: { orderId, userId }
    });

    if (existingReturn) {
      return res.status(400).json({
        success: false,
        message: 'Return request already exists for this order'
      });
    }

    // Calculate expected refund
    let expectedRefund = 0;
    const returnItems = [];

    for (const item of items) {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId);
      if (orderItem) {
        expectedRefund += orderItem.total;
        returnItems.push({
          returnId: '', // Will be set after return creation
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          reason: item.reason,
          exchangeSize: item.exchangeSize,
          exchangeColor: item.exchangeColor
        });
      }
    }

    // Create return
    const returnData = await prisma.return.create({
      data: {
        orderId,
        userId,
        type,
        reason,
        description,
        expectedRefund: type === 'return' ? expectedRefund : null,
        status: 'PENDING'
      }
    });

    // Create return items
    for (const item of returnItems) {
      item.returnId = returnData.id;
      await prisma.returnItem.create({
        data: item
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Return Request Submitted',
        message: `Your ${type} request for order ${order.orderNumber} has been submitted successfully.`,
        data: {
          returnId: returnData.id,
          orderId,
          type
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      data: { return: returnData }
    });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create return request'
    });
  }
};

// Get eligible orders for return
const getEligibleOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED',
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out orders that already have returns
    const eligibleOrders = [];
    for (const order of orders) {
      const existingReturn = await prisma.return.findFirst({
        where: { orderId: order.id, userId }
      });

      if (!existingReturn) {
        eligibleOrders.push({
          ...order,
          eligibleUntil: new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
        });
      }
    }

    res.json({
      success: true,
      data: eligibleOrders
    });
  } catch (error) {
    console.error('Error getting eligible orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible orders'
    });
  }
};

// Cancel return request
const cancelReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnData = await prisma.return.findFirst({
      where: { id, userId, status: 'PENDING' }
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: 'Return not found or cannot be cancelled'
      });
    }

    await prisma.return.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Return request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel return request'
    });
  }
};

// Generate return timeline
const generateReturnTimeline = (returnData) => {
  const timeline = [
    {
      status: 'REQUEST_SUBMITTED',
      title: 'Request Submitted',
      description: 'Your return request has been submitted',
      date: returnData.createdAt,
      completed: true
    }
  ];

  switch (returnData.status) {
    case 'APPROVED':
      timeline.push({
        status: 'UNDER_REVIEW',
        title: 'Under Review',
        description: 'Your request is being reviewed',
        date: new Date(returnData.createdAt.getTime() + 2 * 60 * 60 * 1000),
        completed: true
      });
      timeline.push({
        status: 'APPROVED',
        title: 'Approved',
        description: 'Your return request has been approved',
        date: returnData.updatedAt,
        completed: true
      });
      break;

    case 'PROCESSING':
      timeline.push(
        {
          status: 'UNDER_REVIEW',
          title: 'Under Review',
          description: 'Your request is being reviewed',
          date: new Date(returnData.createdAt.getTime() + 2 * 60 * 60 * 1000),
          completed: true
        },
        {
          status: 'APPROVED',
          title: 'Approved',
          description: 'Your return request has been approved',
          date: new Date(returnData.createdAt.getTime() + 24 * 60 * 60 * 1000),
          completed: true
        },
        {
          status: 'PICKUP_SCHEDULED',
          title: 'Pickup Scheduled',
          description: 'Pickup has been scheduled',
          date: returnData.pickupDate,
          completed: !!returnData.pickupDate
        }
      );
      break;

    case 'COMPLETED':
      timeline.push(
        {
          status: 'UNDER_REVIEW',
          title: 'Under Review',
          description: 'Your request is being reviewed',
          date: new Date(returnData.createdAt.getTime() + 2 * 60 * 60 * 1000),
          completed: true
        },
        {
          status: 'APPROVED',
          title: 'Approved',
          description: 'Your return request has been approved',
          date: new Date(returnData.createdAt.getTime() + 24 * 60 * 60 * 1000),
          completed: true
        },
        {
          status: 'PICKUP_SCHEDULED',
          title: 'Pickup Scheduled',
          description: 'Pickup has been scheduled',
          date: returnData.pickupDate,
          completed: true
        },
        {
          status: 'COMPLETED',
          title: 'Completed',
          description: returnData.type === 'return' ? 'Refund processed' : 'Exchange completed',
          date: returnData.updatedAt,
          completed: true
        }
      );
      break;

    case 'REJECTED':
      timeline.push(
        {
          status: 'UNDER_REVIEW',
          title: 'Under Review',
          description: 'Your request is being reviewed',
          date: new Date(returnData.createdAt.getTime() + 2 * 60 * 60 * 1000),
          completed: true
        },
        {
          status: 'REJECTED',
          title: 'Rejected',
          description: returnData.rejectionReason || 'Request rejected',
          date: returnData.updatedAt,
          completed: true
        }
      );
      break;

    case 'CANCELLED':
      timeline.push({
        status: 'CANCELLED',
        title: 'Cancelled',
        description: 'Request cancelled by customer',
        date: returnData.updatedAt,
        completed: true
      });
      break;
  }

  return timeline;
};

module.exports = {
  getUserReturns,
  getReturnById,
  createReturn,
  getEligibleOrders,
  cancelReturn
}; 