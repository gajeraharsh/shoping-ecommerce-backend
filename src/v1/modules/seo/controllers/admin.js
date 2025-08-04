const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createSEOSchema = z.object({
  pageName: z.string().min(1).max(100),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(255).optional(),
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  robots: z.enum(['index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow']).optional(),
  structuredData: z.any().optional()
});

const updateSEOSchema = createSEOSchema.partial();

// Get all SEO pages
const getAllSEOPages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'pageName',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { pageName: { contains: search, mode: 'insensitive' } },
        { metaTitle: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get SEO pages with pagination
    const [seoPages, total] = await Promise.all([
      prisma.sEOPage.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.sEOPage.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        seoPages,
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

// Get single SEO page by ID
const getSEOPageById = async (req, res) => {
  try {
    const { id } = req.params;

    const seoPage = await prisma.sEOPage.findUnique({
      where: { id }
    });

    if (!seoPage) {
      return res.status(404).json({
        success: false,
        message: 'SEO page not found'
      });
    }

    res.json({
      success: true,
      data: seoPage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get SEO page by page name
const getSEOPageByName = async (req, res) => {
  try {
    const { pageName } = req.params;

    const seoPage = await prisma.sEOPage.findUnique({
      where: { pageName }
    });

    if (!seoPage) {
      return res.status(404).json({
        success: false,
        message: 'SEO page not found'
      });
    }

    res.json({
      success: true,
      data: seoPage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new SEO page
const createSEOPage = async (req, res) => {
  try {
    const seoData = createSEOSchema.parse(req.body);

    // Check if page name already exists
    const existingSEOPage = await prisma.sEOPage.findUnique({
      where: { pageName: seoData.pageName }
    });

    if (existingSEOPage) {
      return res.status(400).json({
        success: false,
        message: 'SEO page with this name already exists'
      });
    }

    const seoPage = await prisma.sEOPage.create({
      data: seoData
    });

    res.status(201).json({
      success: true,
      message: 'SEO page created successfully',
      data: seoPage
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

// Update SEO page
const updateSEOPage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateSEOSchema.parse(req.body);

    const existingSEOPage = await prisma.sEOPage.findUnique({
      where: { id }
    });

    if (!existingSEOPage) {
      return res.status(404).json({
        success: false,
        message: 'SEO page not found'
      });
    }

    // Check if pageName is being updated and already exists
    if (updateData.pageName && updateData.pageName !== existingSEOPage.pageName) {
      const duplicatePage = await prisma.sEOPage.findUnique({
        where: { pageName: updateData.pageName }
      });

      if (duplicatePage) {
        return res.status(400).json({
          success: false,
          message: 'SEO page with this name already exists'
        });
      }
    }

    const seoPage = await prisma.sEOPage.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'SEO page updated successfully',
      data: seoPage
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

// Delete SEO page
const deleteSEOPage = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSEOPage = await prisma.sEOPage.findUnique({
      where: { id }
    });

    if (!existingSEOPage) {
      return res.status(404).json({
        success: false,
        message: 'SEO page not found'
      });
    }

    await prisma.sEOPage.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'SEO page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Generate SEO recommendations
const generateSEORecommendations = async (req, res) => {
  try {
    const { id } = req.params;

    const seoPage = await prisma.sEOPage.findUnique({
      where: { id }
    });

    if (!seoPage) {
      return res.status(404).json({
        success: false,
        message: 'SEO page not found'
      });
    }

    const recommendations = [];

    // Check meta title
    if (!seoPage.metaTitle) {
      recommendations.push({
        type: 'error',
        field: 'metaTitle',
        message: 'Meta title is missing. It should be 50-60 characters.'
      });
    } else if (seoPage.metaTitle.length > 60) {
      recommendations.push({
        type: 'warning',
        field: 'metaTitle',
        message: 'Meta title is too long. Keep it under 60 characters.'
      });
    } else if (seoPage.metaTitle.length < 30) {
      recommendations.push({
        type: 'warning',
        field: 'metaTitle',
        message: 'Meta title is too short. Aim for 50-60 characters.'
      });
    }

    // Check meta description
    if (!seoPage.metaDescription) {
      recommendations.push({
        type: 'error',
        field: 'metaDescription',
        message: 'Meta description is missing. It should be 150-160 characters.'
      });
    } else if (seoPage.metaDescription.length > 160) {
      recommendations.push({
        type: 'warning',
        field: 'metaDescription',
        message: 'Meta description is too long. Keep it under 160 characters.'
      });
    } else if (seoPage.metaDescription.length < 120) {
      recommendations.push({
        type: 'warning',
        field: 'metaDescription',
        message: 'Meta description is too short. Aim for 150-160 characters.'
      });
    }

    // Check Open Graph data
    if (!seoPage.ogTitle) {
      recommendations.push({
        type: 'info',
        field: 'ogTitle',
        message: 'Consider adding Open Graph title for better social media sharing.'
      });
    }

    if (!seoPage.ogDescription) {
      recommendations.push({
        type: 'info',
        field: 'ogDescription',
        message: 'Consider adding Open Graph description for better social media sharing.'
      });
    }

    if (!seoPage.ogImage) {
      recommendations.push({
        type: 'info',
        field: 'ogImage',
        message: 'Consider adding Open Graph image for better social media sharing.'
      });
    }

    // Check canonical URL
    if (!seoPage.canonicalUrl) {
      recommendations.push({
        type: 'info',
        field: 'canonicalUrl',
        message: 'Consider adding canonical URL to prevent duplicate content issues.'
      });
    }

    // Check robots directive
    if (!seoPage.robots) {
      recommendations.push({
        type: 'info',
        field: 'robots',
        message: 'Consider setting robots directive (default is index,follow).'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        score: Math.max(0, 100 - (recommendations.filter(r => r.type === 'error').length * 20) - (recommendations.filter(r => r.type === 'warning').length * 10))
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

// Get SEO statistics
const getSEOStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total SEO pages
      prisma.sEOPage.count(),
      // Pages with meta titles
      prisma.sEOPage.count({ where: { metaTitle: { not: null } } }),
      // Pages with meta descriptions
      prisma.sEOPage.count({ where: { metaDescription: { not: null } } }),
      // Pages with Open Graph data
      prisma.sEOPage.count({ where: { ogTitle: { not: null } } }),
      // Pages with canonical URLs
      prisma.sEOPage.count({ where: { canonicalUrl: { not: null } } })
    ]);

    const totalPages = stats[0];
    const completionRate = totalPages > 0 ? {
      metaTitle: Math.round((stats[1] / totalPages) * 100),
      metaDescription: Math.round((stats[2] / totalPages) * 100),
      openGraph: Math.round((stats[3] / totalPages) * 100),
      canonical: Math.round((stats[4] / totalPages) * 100)
    } : {
      metaTitle: 0,
      metaDescription: 0,
      openGraph: 0,
      canonical: 0
    };

    res.json({
      success: true,
      data: {
        totalPages: totalPages,
        completionRates: completionRate,
        overallScore: totalPages > 0 ? Math.round((stats[1] + stats[2] + stats[3] + stats[4]) / (totalPages * 4) * 100) : 0
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
  getAllSEOPages,
  getSEOPageById,
  getSEOPageByName,
  createSEOPage,
  updateSEOPage,
  deleteSEOPage,
  generateSEORecommendations,
  getSEOStats
};
