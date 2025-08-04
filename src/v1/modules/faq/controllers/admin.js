const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createFAQSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(10).max(2000),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

const updateFAQSchema = createFAQSchema.partial();

// Get all FAQs with pagination and filters
const getAllFAQs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
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
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) where.category = category;
    if (isActive !== '') where.isActive = isActive === 'true';

    // Get FAQs with pagination
    const [faqs, total] = await Promise.all([
      prisma.fAQ.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.fAQ.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        faqs,
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

// Get single FAQ by ID
const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await prisma.fAQ.findUnique({
      where: { id }
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new FAQ
const createFAQ = async (req, res) => {
  try {
    const faqData = createFAQSchema.parse(req.body);

    const faq = await prisma.fAQ.create({
      data: faqData
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
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

// Update FAQ
const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateFAQSchema.parse(req.body);

    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id }
    });

    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
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

// Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id }
    });

    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await prisma.fAQ.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle FAQ status
const toggleFAQStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id }
    });

    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: { isActive: !existingFAQ.isActive }
    });

    res.json({
      success: true,
      message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reorder FAQs
const reorderFAQs = async (req, res) => {
  try {
    const { faqOrders } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(faqOrders)) {
      return res.status(400).json({
        success: false,
        message: 'FAQ orders array is required'
      });
    }

    // Update sort orders
    const updatePromises = faqOrders.map(({ id, sortOrder }) =>
      prisma.fAQ.update({
        where: { id },
        data: { sortOrder }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'FAQs reordered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get FAQ categories
const getFAQCategories = async (req, res) => {
  try {
    const categories = await prisma.fAQ.findMany({
      where: {
        category: { not: null }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get FAQ statistics
const getFAQStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total FAQs
      prisma.fAQ.count(),
      // Active FAQs
      prisma.fAQ.count({ where: { isActive: true } }),
      // FAQs by category
      prisma.fAQ.groupBy({
        by: ['category'],
        _count: true,
        where: { category: { not: null } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalFAQs: stats[0],
        activeFAQs: stats[1],
        categoryCounts: stats[2]
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
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQStatus,
  reorderFAQs,
  getFAQCategories,
  getFAQStats
};
