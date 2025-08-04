const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createBlogSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  slug: z.string().min(3).max(200).optional()
});

const updateBlogSchema = createBlogSchema.partial();

// Get all blog posts with pagination and filters
const getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      isPublished = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) where.categoryId = categoryId;
    if (isPublished !== '') where.isPublished = isPublished === 'true';

    // Get blog posts with pagination
    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true }
          },
          comments: {
            select: { id: true },
            where: { isApproved: true }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        blogs,
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

// Get single blog post by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new blog post
const createBlog = async (req, res) => {
  try {
    const blogData = createBlogSchema.parse(req.body);

    // Generate slug if not provided
    if (!blogData.slug) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug already exists
    const existingBlog = await prisma.blogPost.findUnique({
      where: { slug: blogData.slug }
    });

    if (existingBlog) {
      blogData.slug = `${blogData.slug}-${Date.now()}`;
    }

    // Set publishedAt if publishing
    if (blogData.isPublished && !blogData.publishedAt) {
      blogData.publishedAt = new Date().toISOString();
    }

    const blog = await prisma.blogPost.create({
      data: blogData,
      include: {
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog
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

// Update blog post
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateBlogSchema.parse(req.body);

    const existingBlog = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Handle slug update
    if (updateData.slug && updateData.slug !== existingBlog.slug) {
      const duplicateBlog = await prisma.blogPost.findUnique({
        where: { slug: updateData.slug }
      });

      if (duplicateBlog) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }

    // Handle publishing
    if (updateData.isPublished && !existingBlog.isPublished && !updateData.publishedAt) {
      updateData.publishedAt = new Date().toISOString();
    }

    const blog = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog
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

// Delete blog post
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle blog post status
const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const updateData = {
      isPublished: !existingBlog.isPublished
    };

    // Set publishedAt when publishing
    if (updateData.isPublished && !existingBlog.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const blog = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    res.json({
      success: true,
      message: `Blog post ${blog.isPublished ? 'published' : 'unpublished'} successfully`,
      data: blog
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
const bulkUpdateBlogs = async (req, res) => {
  try {
    const { blogIds, action } = req.body; // action: 'publish', 'unpublish', 'delete'

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Blog IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'publish':
        result = await prisma.blogPost.updateMany({
          where: { id: { in: blogIds } },
          data: { 
            isPublished: true,
            publishedAt: new Date()
          }
        });
        break;
      
      case 'unpublish':
        result = await prisma.blogPost.updateMany({
          where: { id: { in: blogIds } },
          data: { isPublished: false }
        });
        break;
      
      case 'delete':
        result = await prisma.blogPost.deleteMany({
          where: { id: { in: blogIds } }
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: publish, unpublish, or delete'
        });
    }

    res.json({
      success: true,
      message: `${result.count} blog posts ${action}d successfully`,
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

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await prisma.$transaction([
      // Total blogs
      prisma.blogPost.count(),
      // Published blogs
      prisma.blogPost.count({ where: { isPublished: true } }),
      // Draft blogs
      prisma.blogPost.count({ where: { isPublished: false } }),
      // Blogs this month
      prisma.blogPost.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      // Total comments
      prisma.blogComment.count(),
      // Approved comments
      prisma.blogComment.count({ where: { isApproved: true } }),
      // Blogs by category
      prisma.blogPost.groupBy({
        by: ['categoryId'],
        _count: true,
        where: { categoryId: { not: null } }
      })
    ]);

    // Get category details
    const categoryIds = stats[6].map(item => item.categoryId).filter(Boolean);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });

    const categoryBreakdown = stats[6].map(item => ({
      ...item,
      category: categories.find(c => c.id === item.categoryId)
    }));

    res.json({
      success: true,
      data: {
        totalBlogs: stats[0],
        publishedBlogs: stats[1],
        draftBlogs: stats[2],
        blogsThisMonth: stats[3],
        totalComments: stats[4],
        approvedComments: stats[5],
        categoryBreakdown
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
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  bulkUpdateBlogs,
  getBlogStats
};
