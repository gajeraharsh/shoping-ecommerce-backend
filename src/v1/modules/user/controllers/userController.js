const prisma = require('../../../../config/database');
const { updateProfileSchema } = require('../../../../validations/auth');

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
const updateProfile = async (req, res) => {
  const validatedData = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: validatedData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
};

/**
 * @swagger
 * /api/v1/users/addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 */
const getAddresses = async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' }
  });

  res.json({
    success: true,
    data: { addresses }
  });
};

/**
 * @swagger
 * /api/v1/users/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Address added successfully
 */
const addAddress = async (req, res) => {
  const { isDefault, ...addressData } = req.body;

  // If this is set as default, update other addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: {
      ...addressData,
      userId: req.user.id,
      isDefault: isDefault || false
    }
  });

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: { address }
  });
};

/**
 * @swagger
 * /api/v1/users/wishlist:
 *   get:
 *     summary: Get user wishlist
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
const getWishlist = async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' }
          },
          category: true,
          brand: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: { wishlist }
  });
};

/**
 * @swagger
 * /api/v1/users/wishlist/{productId}:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Users]
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
 *         description: Product added to wishlist
 */
const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  const wishlistItem = await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId
      }
    },
    update: {},
    create: {
      userId: req.user.id,
      productId
    }
  });

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
    data: { wishlistItem }
  });
};

/**
 * @swagger
 * /api/v1/users/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 */
const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  await prisma.wishlist.delete({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId
      }
    }
  });

  res.json({
    success: true,
    message: 'Product removed from wishlist'
  });
};

module.exports = {
  updateProfile,
  getAddresses,
  addAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};