const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createInstagramPostSchema = z.object({
  postId: z.string().min(1),
  imageUrl: z.string().url(),
  caption: z.string().optional(),
  permalink: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

const updateInstagramPostSchema = createInstagramPostSchema.partial();

// Get all Instagram posts with pagination and filters
const getAllInstagramPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
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
        { postId: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== '') where.isActive = isActive === 'true';

    // Get Instagram posts with pagination
    const [instagramPosts, total] = await Promise.all([
      prisma.instagramPost.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.instagramPost.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        instagramPosts,
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

// Get single Instagram post by ID
const getInstagramPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const instagramPost = await prisma.instagramPost.findUnique({
      where: { id }
    });

    if (!instagramPost) {
      return res.status(404).json({
        success: false,
        message: 'Instagram post not found'
      });
    }

    res.json({
      success: true,
      data: instagramPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new Instagram post
const createInstagramPost = async (req, res) => {
  try {
    const postData = createInstagramPostSchema.parse(req.body);

    // Check if post ID already exists
    const existingPost = await prisma.instagramPost.findUnique({
      where: { postId: postData.postId }
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'Instagram post with this ID already exists'
      });
    }

    const instagramPost = await prisma.instagramPost.create({
      data: postData
    });

    res.status(201).json({
      success: true,
      message: 'Instagram post created successfully',
      data: instagramPost
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

// Update Instagram post
const updateInstagramPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateInstagramPostSchema.parse(req.body);

    const existingPost = await prisma.instagramPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Instagram post not found'
      });
    }

    // Check if postId is being updated and already exists
    if (updateData.postId && updateData.postId !== existingPost.postId) {
      const duplicatePost = await prisma.instagramPost.findUnique({
        where: { postId: updateData.postId }
      });

      if (duplicatePost) {
        return res.status(400).json({
          success: false,
          message: 'Instagram post with this ID already exists'
        });
      }
    }

    const instagramPost = await prisma.instagramPost.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Instagram post updated successfully',
      data: instagramPost
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

// Delete Instagram post
const deleteInstagramPost = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.instagramPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Instagram post not found'
      });
    }

    await prisma.instagramPost.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Instagram post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle Instagram post status
const toggleInstagramPostStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.instagramPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Instagram post not found'
      });
    }

    const instagramPost = await prisma.instagramPost.update({
      where: { id },
      data: { isActive: !existingPost.isActive }
    });

    res.json({
      success: true,
      message: `Instagram post ${instagramPost.isActive ? 'activated' : 'deactivated'} successfully`,
      data: instagramPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reorder Instagram posts
const reorderInstagramPosts = async (req, res) => {
  try {
    const { postOrders } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(postOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Post orders array is required'
      });
    }

    // Update sort orders
    const updatePromises = postOrders.map(({ id, sortOrder }) =>
      prisma.instagramPost.update({
        where: { id },
        data: { sortOrder }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Instagram posts reordered successfully'
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
const bulkUpdateInstagramPosts = async (req, res) => {
  try {
    const { postIds, action } = req.body; // action: 'activate', 'deactivate', 'delete'

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.instagramPost.updateMany({
          where: { id: { in: postIds } },
          data: { isActive: true }
        });
        break;
      
      case 'deactivate':
        result = await prisma.instagramPost.updateMany({
          where: { id: { in: postIds } },
          data: { isActive: false }
        });
        break;
      
      case 'delete':
        result = await prisma.instagramPost.deleteMany({
          where: { id: { in: postIds } }
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
      message: `${result.count} Instagram posts ${action}d successfully`,
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

// Get Instagram statistics
const getInstagramStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total posts
      prisma.instagramPost.count(),
      // Active posts
      prisma.instagramPost.count({ where: { isActive: true } }),
      // Inactive posts
      prisma.instagramPost.count({ where: { isActive: false } })
    ]);

    res.json({
      success: true,
      data: {
        totalPosts: stats[0],
        activePosts: stats[1],
        inactivePosts: stats[2]
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

// Sync with Instagram API (placeholder - would need Instagram Basic Display API)
const syncWithInstagram = async (req, res) => {
  try {
    // This is a placeholder for Instagram API integration
    // In a real implementation, you would:
    // 1. Use Instagram Basic Display API or Instagram Graph API
    // 2. Fetch recent posts from the connected Instagram account
    // 3. Save new posts to the database
    // 4. Update existing posts if needed

    res.json({
      success: true,
      message: 'Instagram sync feature not implemented yet. Please add posts manually.',
      data: {
        note: 'To implement Instagram sync, you need to set up Instagram Basic Display API and handle OAuth authentication.'
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
  getAllInstagramPosts,
  getInstagramPostById,
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
  toggleInstagramPostStatus,
  reorderInstagramPosts,
  bulkUpdateInstagramPosts,
  getInstagramStats,
  syncWithInstagram
};
