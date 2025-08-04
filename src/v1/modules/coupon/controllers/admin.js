const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().min(0),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  usageCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  userRestrictions: z.enum(['ALL', 'NEW_USERS', 'EXISTING_USERS', 'VIP']).default('ALL')
});

const updateCouponSchema = createCouponSchema.partial();

// Get all coupons with pagination and filters
const getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      isActive = '',
      userRestrictions = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type) where.type = type;
    if (isActive !== '') where.isActive = isActive === 'true';
    if (userRestrictions) where.userRestrictions = userRestrictions;

    // Get coupons with pagination
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.coupon.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        coupons,
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

// Get single coupon by ID
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            discountAmount: true,
            createdAt: true,
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new coupon
const createCoupon = async (req, res) => {
  try {
    const couponData = createCouponSchema.parse(req.body);

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: couponData.code }
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Validate date range
    const startDate = new Date(couponData.startDate);
    const endDate = new Date(couponData.endDate);

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const coupon = await prisma.coupon.create({
      data: couponData,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
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

// Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateCouponSchema.parse(req.body);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if code is being updated and already exists
    if (updateData.code && updateData.code !== existingCoupon.code) {
      const duplicateCoupon = await prisma.coupon.findUnique({
        where: { code: updateData.code }
      });

      if (duplicateCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }

    // Validate date range if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = new Date(updateData.startDate || existingCoupon.startDate);
      const endDate = new Date(updateData.endDate || existingCoupon.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
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

// Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if coupon has been used
    if (existingCoupon._count.orders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete coupon that has been used in orders'
      });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle coupon status
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: !existingCoupon.isActive },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk operations
const bulkUpdateCoupons = async (req, res) => {
  try {
    const { couponIds, action } = req.body; // action: 'activate', 'deactivate', 'delete'

    if (!Array.isArray(couponIds) || couponIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Coupon IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.coupon.updateMany({
          where: { id: { in: couponIds } },
          data: { isActive: true }
        });
        break;
      
      case 'deactivate':
        result = await prisma.coupon.updateMany({
          where: { id: { in: couponIds } },
          data: { isActive: false }
        });
        break;
      
      case 'delete':
        // Check if any coupons have been used
        const usedCoupons = await prisma.coupon.findMany({
          where: {
            id: { in: couponIds },
            orders: { some: {} }
          },
          select: { id: true, code: true }
        });

        if (usedCoupons.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot delete coupons that have been used: ${usedCoupons.map(c => c.code).join(', ')}`
          });
        }

        result = await prisma.coupon.deleteMany({
          where: { id: { in: couponIds } }
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: activate, deactivate, or delete'
        });
    }

    res.json({
      success: true,
      message: `${result.count} coupons ${action}d successfully`,
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

// Validate coupon (for frontend use)
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount = 0, userId, categoryIds = [], productIds = [] } = req.query;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    const now = new Date();
    const errors = [];

    // Check if coupon is active
    if (!coupon.isActive) {
      errors.push('Coupon is not active');
    }

    // Check date validity
    if (now < new Date(coupon.startDate)) {
      errors.push('Coupon is not yet valid');
    }

    if (now > new Date(coupon.endDate)) {
      errors.push('Coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      errors.push('Coupon usage limit exceeded');
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount && parseFloat(orderAmount) < coupon.minimumOrderAmount) {
      errors.push(`Minimum order amount of $${coupon.minimumOrderAmount} required`);
    }

    // Check category restrictions
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const categoryArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      const hasValidCategory = categoryArray.some(id => coupon.applicableCategories.includes(id));
      if (!hasValidCategory) {
        errors.push('Coupon not applicable to selected categories');
      }
    }

    // Check product restrictions
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const productArray = Array.isArray(productIds) ? productIds : [productIds];
      const hasValidProduct = productArray.some(id => coupon.applicableProducts.includes(id));
      if (!hasValidProduct) {
        errors.push('Coupon not applicable to selected products');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    // Calculate discount
    let discountAmount = 0;
    const orderAmountFloat = parseFloat(orderAmount);

    switch (coupon.type) {
      case 'PERCENTAGE':
        discountAmount = (orderAmountFloat * coupon.value) / 100;
        if (coupon.maximumDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maximumDiscountAmount);
        }
        break;
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(coupon.value, orderAmountFloat);
        break;
      case 'FREE_SHIPPING':
        discountAmount = 0; // Shipping discount handled separately
        break;
    }

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon,
        discountAmount,
        finalAmount: orderAmountFloat - discountAmount
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

// Get coupon statistics
const getCouponStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await prisma.$transaction([
      // Total coupons
      prisma.coupon.count(),
      // Active coupons
      prisma.coupon.count({ where: { isActive: true } }),
      // Expired coupons
      prisma.coupon.count({ where: { endDate: { lt: today } } }),
      // Coupons created this month
      prisma.coupon.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      // Total coupon usage
      prisma.coupon.aggregate({
        _sum: { usageCount: true }
      }),
      // Coupons by type
      prisma.coupon.groupBy({
        by: ['type'],
        _count: true
      }),
      // Most used coupons
      prisma.coupon.findMany({
        orderBy: { usageCount: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          usageCount: true,
          type: true,
          value: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCoupons: stats[0],
        activeCoupons: stats[1],
        expiredCoupons: stats[2],
        couponsThisMonth: stats[3],
        totalUsage: stats[4]._sum.usageCount || 0,
        typeBreakdown: stats[5],
        mostUsedCoupons: stats[6]
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

module.exports = {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  bulkUpdateCoupons,
  validateCoupon,
  getCouponStats
};
