const prisma = require('../../../../config/database');

/**
 * @swagger
 * /api/v1/banners:
 *   get:
 *     summary: Get active banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
const getBanners = async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [
        { validFrom: null, validUntil: null },
        {
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() }
        }
      ]
    },
    orderBy: { sortOrder: 'asc' }
  });

  res.json({
    success: true,
    data: { banners }
  });
};

/**
 * @swagger
 * /api/v1/banners:
 *   post:
 *     summary: Create banner (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
const createBanner = async (req, res) => {
  const banner = await prisma.banner.create({
    data: req.body
  });

  res.status(201).json({
    success: true,
    message: 'Banner created successfully',
    data: { banner }
  });
};

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   put:
 *     summary: Update banner (Admin only)
 *     tags: [Banners]
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
 *         description: Banner updated successfully
 */
const updateBanner = async (req, res) => {
  const { id } = req.params;

  const banner = await prisma.banner.update({
    where: { id },
    data: req.body
  });

  res.json({
    success: true,
    message: 'Banner updated successfully',
    data: { banner }
  });
};

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   delete:
 *     summary: Delete banner (Admin only)
 *     tags: [Banners]
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
 *         description: Banner deleted successfully
 */
const deleteBanner = async (req, res) => {
  const { id } = req.params;

  await prisma.banner.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Banner deleted successfully'
  });
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
};