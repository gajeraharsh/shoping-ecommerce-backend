const prisma = require('../../../../config/database');
const { createReviewSchema, updateReviewSchema } = require('../../../../validations/product');

/**
 * @swagger
 * /api/v1/products/{productId}/reviews:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        productId,
        isApproved: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({
      where: {
        productId,
        isApproved: true
      }
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
};

/**
 * @swagger
 * /api/v1/products/{productId}/reviews:
 *   post:
 *     summary: Create a review for a product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
const createReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const validatedData = createReviewSchema.parse(req.body);

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user has already reviewed this product
  const existingReview = await prisma.review.findUnique({
    where: {
      productId_userId: {
        productId,
        userId
      }
    }
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  const review = await prisma.review.create({
    data: {
      ...validatedData,
      productId,
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  });

  // Update product rating and review count
  const productReviews = await prisma.review.findMany({
    where: {
      productId,
      isApproved: true
    },
    select: { rating: true }
  });

  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: avgRating,
      reviewCount: productReviews.length
    }
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review }
  });
};

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *         description: Review updated successfully
 */
const updateReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const validatedData = updateReviewSchema.parse(req.body);

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the review or is admin
  if (review.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reviews'
    });
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: validatedData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  });

  // Update product rating if rating changed
  if (validatedData.rating !== undefined) {
    const productReviews = await prisma.review.findMany({
      where: {
        productId: review.productId,
        isApproved: true
      },
      select: { rating: true }
    });

    const avgRating = productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: avgRating,
        reviewCount: productReviews.length
      }
    });
  }

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: { review: updatedReview }
  });
};

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 */
const deleteReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the review or is admin
  if (review.userId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own reviews'
    });
  }

  await prisma.review.delete({
    where: { id }
  });

  // Update product rating and review count
  const productReviews = await prisma.review.findMany({
    where: {
      productId: review.productId,
      isApproved: true
    },
    select: { rating: true }
  });

  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: avgRating,
      reviewCount: productReviews.length
    }
  });

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
};

/**
 * @swagger
 * /api/v1/reviews/{id}/approve:
 *   patch:
 *     summary: Approve a review (Admin only)
 *     tags: [Reviews]
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
 *         description: Review approved successfully
 */
const approveReview = async (req, res) => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await prisma.review.update({
    where: { id },
    data: { isApproved: true }
  });

  // Update product rating and review count
  const productReviews = await prisma.review.findMany({
    where: {
      productId: review.productId,
      isApproved: true
    },
    select: { rating: true }
  });

  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: avgRating,
      reviewCount: productReviews.length
    }
  });

  res.json({
    success: true,
    message: 'Review approved successfully'
  });
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview
}; 