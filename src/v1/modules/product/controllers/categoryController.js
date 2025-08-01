const prisma = require('../../../../config/database');
const { generateUniqueSlug } = require('../../../../utils/slugify');
const { createCategorySchema } = require('../../../../validations/product');

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    }
  });

  res.json({
    success: true,
    data: { categories }
  });
};

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Category created successfully
 */
const createCategory = async (req, res) => {
  const validatedData = createCategorySchema.parse(req.body);

  const slug = await generateUniqueSlug(validatedData.name, prisma.category);

  const category = await prisma.category.create({
    data: {
      ...validatedData,
      slug
    }
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
};

module.exports = {
  getCategories,
  createCategory
};