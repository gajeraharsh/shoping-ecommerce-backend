/**
 * Blog Service
 * Contains business logic for blog operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');
const { uploadToS3 } = require('../../utils/upload');

/**
 * Create a new blog post
 * @param {Object} postData - Blog post data
 * @param {number} authorId - Author ID
 * @param {Object} file - Cover image file
 * @returns {Object} Created blog post
 */
const createBlogPost = async (postData, authorId, file) => {
  const { categoryId, ...data } = postData;

  // Verify blog category exists
  const category = await prisma.blogCategory.findFirst({
    where: { id: Number(categoryId), ...notDeletedWhere() }
  });

  if (!category) {
    throw new Error('Blog category not found');
  }

  // Handle cover image upload
  let coverImageUrl = null;
  if (file) {
    coverImageUrl = await uploadToS3(file.buffer, `blog/${Date.now()}-${file.originalname}`, file.mimetype);
  }

  return await prisma.blogPost.create({
    data: {
      ...data,
      authorId: Number(authorId),
      categoryId: Number(categoryId),
      coverImage: coverImageUrl,
      tags: data.tags ? JSON.parse(data.tags) : null,
      publishedAt: data.published ? new Date() : null
    },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      category: true,
      _count: {
        select: { comments: true }
      }
    }
  });
};

/**
 * Get blog posts with pagination, filtering, and search
 * @param {Object} query - Query parameters
 * @returns {Object} Blog posts with metadata
 */
const getBlogPosts = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    search,
    categoryId,
    published,
    authorId
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { ...notDeletedWhere() };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categoryId) {
    where.categoryId = Number(categoryId);
  }

  if (published !== undefined) {
    where.published = published === 'true';
  }

  if (authorId) {
    where.authorId = Number(authorId);
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.blogPost.count({ where })
  ]);

  return {
    data: posts,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get blog post by ID or slug
 * @param {string} identifier - Post ID or slug
 * @returns {Object|null} Blog post or null
 */
const getBlogPostById = async (identifier) => {
  const isNumeric = !isNaN(identifier);
  
  const where = {
    ...notDeletedWhere(),
    ...(isNumeric ? { id: Number(identifier) } : { slug: identifier })
  };

  return await prisma.blogPost.findFirst({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      category: true,
      comments: {
        where: notDeletedWhere(),
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { comments: true }
      }
    }
  });
};

/**
 * Update blog post by ID
 * @param {string} id - Post ID
 * @param {Object} updateData - Update data
 * @param {Object} file - New cover image file
 * @returns {Object} Updated blog post
 */
const updateBlogPost = async (id, updateData, file) => {
  const { categoryId, ...data } = updateData;

  // Verify post exists
  const existingPost = await prisma.blogPost.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!existingPost) {
    throw new Error('Blog post not found');
  }

  // Verify category if provided
  if (categoryId) {
    const category = await prisma.blogCategory.findFirst({
      where: { id: Number(categoryId), ...notDeletedWhere() }
    });

    if (!category) {
      throw new Error('Blog category not found');
    }
  }

  // Handle cover image upload
  let coverImageUrl = existingPost.coverImage;
  if (file) {
    coverImageUrl = await uploadToS3(file.buffer, `blog/${Date.now()}-${file.originalname}`, file.mimetype);
  }

  const updatePayload = { ...data };
  if (categoryId) updatePayload.categoryId = Number(categoryId);
  if (file) updatePayload.coverImage = coverImageUrl;
  if (data.tags) updatePayload.tags = JSON.parse(data.tags);
  if (data.published === 'true' && !existingPost.published) {
    updatePayload.published = true;
    updatePayload.publishedAt = new Date();
  } else if (data.published === 'false') {
    updatePayload.published = false;
    updatePayload.publishedAt = null;
  }

  return await prisma.blogPost.update({
    where: { id: Number(id) },
    data: updatePayload,
    include: {
      author: {
        select: { id: true, name: true, email: true }
      },
      category: true,
      _count: {
        select: { comments: true }
      }
    }
  });
};

/**
 * Soft delete blog post by ID
 * @param {string} id - Post ID
 */
const deleteBlogPost = async (id) => {
  const post = await prisma.blogPost.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!post) {
    throw new Error('Blog post not found');
  }

  await markDeleted('blogPost', id, prisma);
};

/**
 * Add comment to blog post
 * @param {string} postId - Post ID
 * @param {number} userId - User ID
 * @param {string} content - Comment content
 * @returns {Object} Created comment
 */
const addComment = async (postId, userId, content) => {
  // Verify post exists and is published
  const post = await prisma.blogPost.findFirst({
    where: { 
      id: Number(postId), 
      published: true,
      ...notDeletedWhere() 
    }
  });

  if (!post) {
    throw new Error('Blog post not found or not published');
  }

  return await prisma.blogComment.create({
    data: {
      postId: Number(postId),
      userId: Number(userId),
      content
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
};

/**
 * Get comments for a blog post
 * @param {string} postId - Post ID
 * @param {Object} query - Query parameters
 * @returns {Object} Comments with metadata
 */
const getComments = async (postId, query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc'
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Verify post exists
  const post = await prisma.blogPost.findFirst({
    where: { id: Number(postId), ...notDeletedWhere() }
  });

  if (!post) {
    throw new Error('Blog post not found');
  }

  const where = { 
    postId: Number(postId),
    ...notDeletedWhere() 
  };

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [comments, total] = await Promise.all([
    prisma.blogComment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.blogComment.count({ where })
  ]);

  return {
    data: comments,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

module.exports = {
  createBlogPost,
  getBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments
};
