const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createNewsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updateNewsletterSchema = z.object({
  isActive: z.boolean().optional()
});

// Get all newsletter subscribers with pagination and filters
const getAllSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive = '',
      source = '',
      sortBy = 'subscribedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    
    if (isActive !== '') where.isActive = isActive === 'true';
    if (source) where.source = source;

    // Get subscribers with pagination
    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.newsletter.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        subscribers,
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

// Get single subscriber by ID
const getSubscriberById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await prisma.newsletter.findUnique({
      where: { id }
    });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      data: subscriber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new subscriber
const createSubscriber = async (req, res) => {
  try {
    const subscriberData = createNewsletterSchema.parse(req.body);

    // Check if email already exists
    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { email: subscriberData.email }
    });

    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed'
      });
    }

    const subscriber = await prisma.newsletter.create({
      data: subscriberData
    });

    res.status(201).json({
      success: true,
      message: 'Subscriber added successfully',
      data: subscriber
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

// Update subscriber
const updateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateNewsletterSchema.parse(req.body);

    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { id }
    });

    if (!existingSubscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // If unsubscribing, set unsubscribedAt
    if (updateData.isActive === false && existingSubscriber.isActive) {
      updateData.unsubscribedAt = new Date();
    }
    // If resubscribing, clear unsubscribedAt
    else if (updateData.isActive === true && !existingSubscriber.isActive) {
      updateData.unsubscribedAt = null;
    }

    const subscriber = await prisma.newsletter.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Subscriber updated successfully',
      data: subscriber
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

// Delete subscriber
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { id }
    });

    if (!existingSubscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    await prisma.newsletter.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle subscriber status
const toggleSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { id }
    });

    if (!existingSubscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    const updateData = {
      isActive: !existingSubscriber.isActive
    };

    // Set unsubscribedAt when deactivating
    if (!updateData.isActive) {
      updateData.unsubscribedAt = new Date();
    } else {
      updateData.unsubscribedAt = null;
    }

    const subscriber = await prisma.newsletter.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: `Subscriber ${subscriber.isActive ? 'subscribed' : 'unsubscribed'} successfully`,
      data: subscriber
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
const bulkUpdateSubscribers = async (req, res) => {
  try {
    const { subscriberIds, action } = req.body; // action: 'subscribe', 'unsubscribe', 'delete'

    if (!Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subscriber IDs array is required'
      });
    }

    let result;
    const updateData = {};

    switch (action) {
      case 'subscribe':
        updateData.isActive = true;
        updateData.unsubscribedAt = null;
        result = await prisma.newsletter.updateMany({
          where: { id: { in: subscriberIds } },
          data: updateData
        });
        break;
      
      case 'unsubscribe':
        updateData.isActive = false;
        updateData.unsubscribedAt = new Date();
        result = await prisma.newsletter.updateMany({
          where: { id: { in: subscriberIds } },
          data: updateData
        });
        break;
      
      case 'delete':
        result = await prisma.newsletter.deleteMany({
          where: { id: { in: subscriberIds } }
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: subscribe, unsubscribe, or delete'
        });
    }

    res.json({
      success: true,
      message: `${result.count} subscribers ${action}d successfully`,
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

// Get newsletter statistics
const getNewsletterStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await prisma.$transaction([
      // Total subscribers
      prisma.newsletter.count(),
      // Active subscribers
      prisma.newsletter.count({ where: { isActive: true } }),
      // Unsubscribed
      prisma.newsletter.count({ where: { isActive: false } }),
      // New subscribers this month
      prisma.newsletter.count({
        where: {
          subscribedAt: { gte: startOfMonth }
        }
      }),
      // Subscribers by source
      prisma.newsletter.groupBy({
        by: ['source'],
        _count: true,
        where: { source: { not: null } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalSubscribers: stats[0],
        activeSubscribers: stats[1],
        unsubscribed: stats[2],
        newThisMonth: stats[3],
        sourceBreakdown: stats[4]
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

// Export subscribers (CSV format)
const exportSubscribers = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const subscribers = await prisma.newsletter.findMany({
      where,
      orderBy: { subscribedAt: 'desc' }
    });

    // Convert to CSV format
    const csvHeader = 'Email,Status,Source,Subscribed At,Unsubscribed At\n';
    const csvData = subscribers.map(sub => 
      `${sub.email},${sub.isActive ? 'Active' : 'Inactive'},${sub.source || ''},${sub.subscribedAt.toISOString()},${sub.unsubscribedAt ? sub.unsubscribedAt.toISOString() : ''}`
    ).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=newsletter-subscribers.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubscribers,
  getSubscriberById,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  toggleSubscriberStatus,
  bulkUpdateSubscribers,
  getNewsletterStats,
  exportSubscribers
};
