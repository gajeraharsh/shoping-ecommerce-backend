const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const slugify = require('slugify');

const prisma = new PrismaClient();

// Validation schemas
const createBlogPostSchema = z.object({
  title: z.string().min(5).max(200),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  image: z.string().url(),
  category: z.string().min(2),
  tags: z.array(z.string()).optional(),
  readTime: z.number().int().positive().default(5),
  isPublished: z.boolean().default(false)
});

const updateBlogPostSchema = createBlogPostSchema.partial();

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000)
});

// Get all published blog posts
const getBlogPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {
      isPublished: true
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get posts with pagination
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    });

    // Get total count
    const total = await prisma.blogPost.count({ where });

    // Get categories for filtering
    const categories = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category']
    });

    const response = {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      categories: categories.map(c => c.category)
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single blog post
const getBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        isPublished: true
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        comments: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment likes (view count)
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create blog post (admin only)
const createBlogPost = async (req, res) => {
  try {
    const postData = createBlogPostSchema.parse(req.body);
    
    // Generate slug
    const slug = slugify(postData.title, { lower: true, strict: true });
    
    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'A post with this title already exists'
      });
    }

    const post = await prisma.blogPost.create({
      data: {
        ...postData,
        slug,
        authorId: req.user.id,
        publishedAt: postData.isPublished ? new Date() : null
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: { post }
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

// Update blog post (admin only)
const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateBlogPostSchema.parse(req.body);

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Generate new slug if title changed
    if (updateData.title && updateData.title !== existingPost.title) {
      const newSlug = slugify(updateData.title, { lower: true, strict: true });
      
      // Check if new slug already exists
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug: newSlug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'A post with this title already exists'
        });
      }

      updateData.slug = newSlug;
    }

    // Set publishedAt if publishing for the first time
    if (updateData.isPublished && !existingPost.isPublished) {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: { post }
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

// Delete blog post (admin only)
const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!post) {
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

// Add comment to blog post
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = createCommentSchema.parse(req.body);

    // Check if post exists and is published
    const post = await prisma.blogPost.findFirst({
      where: {
        id: postId,
        isPublished: true
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comment = await prisma.blogComment.create({
      data: {
        postId,
        userId: req.user.id,
        content,
        isApproved: req.user.role === 'ADMIN' // Auto-approve admin comments
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Update comment count
    await prisma.blogPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
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

// Get comments for a blog post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await prisma.blogComment.findMany({
      where: {
        postId,
        isApproved: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.blogComment.count({
      where: {
        postId,
        isApproved: true
      }
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

// Approve/Reject comment (admin only)
const moderateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const comment = await prisma.blogComment.findUnique({
      where: { id },
      include: { post: true }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await prisma.blogComment.update({
      where: { id },
      data: { isApproved }
    });

    // Update comment count on post
    const commentCount = await prisma.blogComment.count({
      where: {
        postId: comment.postId,
        isApproved: true
      }
    });

    await prisma.blogPost.update({
      where: { id: comment.postId },
      data: { commentCount }
    });

    res.json({
      success: true,
      message: `Comment ${isApproved ? 'approved' : 'rejected'} successfully`
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
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments,
  moderateComment
}; 