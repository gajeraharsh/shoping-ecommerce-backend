const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const slugify = require('slugify');

const prisma = new PrismaClient();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories with pagination and filters
const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Get categories with pagination
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.category.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        categories,
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

// Get single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            isActive: true,
            stockQuantity: true,
            images: {
              where: { isPrimary: true },
              select: { url: true, alt: true }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const categoryData = createCategorySchema.parse(req.body);

    // Generate slug
    const baseSlug = slugify(categoryData.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...categoryData,
        slug
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
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

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update slug if name is being changed
    if (updateData.name && updateData.name !== existingCategory.name) {
      const baseSlug = slugify(updateData.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await prisma.category.findFirst({ 
        where: { slug, id: { not: id } } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
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

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated products'
      });
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle category active status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Toggle status
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: !existingCategory.isActive },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total categories
      prisma.category.count(),
      // Active categories
      prisma.category.count({ where: { isActive: true } }),
      // Categories with products
      prisma.category.count({
        where: {
          products: {
            some: {}
          }
        }
      }),
      // Categories created this month
      prisma.category.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    // Get top categories by product count
    const topCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalCategories: stats[0],
        activeCategories: stats[1],
        categoriesWithProducts: stats[2],
        newCategoriesThisMonth: stats[3],
        topCategories
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

// Reorder categories
const reorderCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Category orders array is required'
      });
    }

    // Update sort orders
    const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully'
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
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
  reorderCategories
};
