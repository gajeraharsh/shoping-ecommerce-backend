const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'SIDEBAR', 'FOOTER', 'POPUP', 'CATEGORY']),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetAudience: z.enum(['ALL', 'NEW_USERS', 'RETURNING_USERS', 'VIP']).default('ALL'),
  clickCount: z.number().int().min(0).default(0)
});

const updateBannerSchema = createBannerSchema.partial();

// Get all banners with pagination and filters
const getAllBanners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      position = '',
      isActive = '',
      targetAudience = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (position) where.position = position;
    if (isActive !== '') where.isActive = isActive === 'true';
    if (targetAudience) where.targetAudience = targetAudience;

    // Get banners with pagination
    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.banner.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        banners,
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

// Get single banner by ID
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new banner
const createBanner = async (req, res) => {
  try {
    const bannerData = createBannerSchema.parse(req.body);

    const banner = await prisma.banner.create({
      data: bannerData
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
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

// Update banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateBannerSchema.parse(req.body);

    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
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

// Delete banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await prisma.banner.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle banner status
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive: !existingBanner.isActive }
    });

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reorder banners
const reorderBanners = async (req, res) => {
  try {
    const { bannerOrders } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(bannerOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Banner orders array is required'
      });
    }

    // Update sort orders
    const updatePromises = bannerOrders.map(({ id, sortOrder }) =>
      prisma.banner.update({
        where: { id },
        data: { sortOrder }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Banners reordered successfully'
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
const bulkUpdateBanners = async (req, res) => {
  try {
    const { bannerIds, action } = req.body; // action: 'activate', 'deactivate', 'delete'

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Banner IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.banner.updateMany({
          where: { id: { in: bannerIds } },
          data: { isActive: true }
        });
        break;
      
      case 'deactivate':
        result = await prisma.banner.updateMany({
          where: { id: { in: bannerIds } },
          data: { isActive: false }
        });
        break;
      
      case 'delete':
        result = await prisma.banner.deleteMany({
          where: { id: { in: bannerIds } }
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
      message: `${result.count} banners ${action}d successfully`,
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

// Track banner click
const trackBannerClick = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        clickCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Banner click tracked successfully',
      data: { clickCount: banner.clickCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get banner statistics
const getBannerStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await prisma.$transaction([
      // Total banners
      prisma.banner.count(),
      // Active banners
      prisma.banner.count({ where: { isActive: true } }),
      // Banners by position
      prisma.banner.groupBy({
        by: ['position'],
        _count: true
      }),
      // Banners by target audience
      prisma.banner.groupBy({
        by: ['targetAudience'],
        _count: true
      }),
      // Total clicks
      prisma.banner.aggregate({
        _sum: { clickCount: true }
      }),
      // Top performing banners
      prisma.banner.findMany({
        orderBy: { clickCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          clickCount: true,
          position: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalBanners: stats[0],
        activeBanners: stats[1],
        positionBreakdown: stats[2],
        audienceBreakdown: stats[3],
        totalClicks: stats[4]._sum.clickCount || 0,
        topPerformingBanners: stats[5]
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

// Get active banners by position (for frontend display)
const getActiveBannersByPosition = async (req, res) => {
  try {
    const { position } = req.params;

    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        position: position.toUpperCase(),
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: banners
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
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners,
  bulkUpdateBanners,
  trackBannerClick,
  getBannerStats,
  getActiveBannersByPosition
};
