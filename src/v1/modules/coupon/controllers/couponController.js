const prisma = require('../../../../config/database');

/**
 * @swagger
 * /api/v1/coupons/validate/{code}:
 *   get:
 *     summary: Validate coupon code
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Invalid or expired coupon
 */
const validateCoupon = async (req, res) => {
  const { code } = req.params;
  const { amount } = req.query;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Order amount is required'
    });
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() }
    }
  });

  if (!coupon) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired coupon'
    });
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'Coupon usage limit exceeded'
    });
  }

  if (coupon.minimumAmount && parseFloat(amount) < coupon.minimumAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount of $${coupon.minimumAmount} required`
    });
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (parseFloat(amount) * coupon.discountValue) / 100;
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    data: {
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: Get all coupons (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
const getCoupons = async (req, res) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { coupons }
  });
};

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Create coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
const createCoupon = async (req, res) => {
  const { code, ...data } = req.body;

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      ...data
    }
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: { coupon }
  });
};

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   put:
 *     summary: Update coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon updated successfully
 */
const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, ...data } = req.body;

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(code && { code: code.toUpperCase() }),
      ...data
    }
  });

  res.json({
    success: true,
    message: 'Coupon updated successfully',
    data: { coupon }
  });
};

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  await prisma.coupon.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Coupon deleted successfully'
  });
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};