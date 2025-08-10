/**
 * Blog Module Tests
 * Tests for blog post CRUD operations, publishing, and content management
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Blog Module', () => {
  let authToken;
  let adminToken;
  let testBlogId;
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.blogPost.deleteMany({
      where: { title: { contains: 'Test Blog' } }
    });

    // Create test user
    const userData = {
      firstName: 'Blog',
      lastName: 'User',
      email: 'bloguser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.accessToken;
    testUserId = userResponse.body.data.user.id;

    // Create admin user
    const adminData = {
      firstName: 'Blog',
      lastName: 'Admin',
      email: 'blogadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.blogPost.deleteMany({
      where: { title: { contains: 'Test Blog' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'blog' } }
    });
    await prisma.$disconnect();
  });

  // Public routes tests
  describe('Public Blog Routes', () => {
    describe('GET /api/blog', () => {
      it('should get published blog posts', async () => {
        const response = await request(app)
          .get('/api/blog')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/blog?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should support search', async () => {
        const response = await request(app)
          .get('/api/blog?search=fashion')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get('/api/blog?category=fashion')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should sort posts', async () => {
        const response = await request(app)
          .get('/api/blog?sortBy=createdAt&sortOrder=desc')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should only return published posts', async () => {
        const response = await request(app)
          .get('/api/blog')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.posts.forEach(post => {
          expect(post.status).toBe('PUBLISHED');
        });
      });
    });

    describe('GET /api/blog/:slug', () => {
      beforeEach(async () => {
        // Create a published blog post
        const blogData = {
          title: 'Test Blog Post',
          content: 'This is a test blog post content.',
          excerpt: 'Test excerpt',
          slug: 'test-blog-post',
          category: 'fashion',
          tags: ['test', 'fashion'],
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date().toISOString()
        };

        const createResponse = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData);

        testBlogId = createResponse.body.data.id;
      });

      it('should get blog post by slug', async () => {
        const response = await request(app)
          .get('/api/blog/test-blog-post')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.slug).toBe('test-blog-post');
        expect(response.body.data.title).toBe('Test Blog Post');
      });

      it('should increment view count', async () => {
        const response1 = await request(app)
          .get('/api/blog/test-blog-post')
          .expect(200);

        const initialViews = response1.body.data.views || 0;

        const response2 = await request(app)
          .get('/api/blog/test-blog-post')
          .expect(200);

        expect(response2.body.data.views).toBe(initialViews + 1);
      });

      it('should fail with invalid slug', async () => {
        const response = await request(app)
          .get('/api/blog/non-existent-slug')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Blog post not found');
      });

      it('should fail for unpublished posts', async () => {
        // Create unpublished post
        const unpublishedData = {
          title: 'Unpublished Post',
          content: 'This post is not published.',
          slug: 'unpublished-post',
          status: 'DRAFT',
          isPublished: false
        };

        await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(unpublishedData);

        const response = await request(app)
          .get('/api/blog/unpublished-post')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Blog post not found');
      });
    });

    describe('GET /api/blog/categories', () => {
      it('should get blog categories', async () => {
        const response = await request(app)
          .get('/api/blog/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('categories');
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });
    });

    describe('GET /api/blog/tags', () => {
      it('should get blog tags', async () => {
        const response = await request(app)
          .get('/api/blog/tags')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('tags');
        expect(Array.isArray(response.body.data.tags)).toBe(true);
      });
    });

    describe('GET /api/blog/featured', () => {
      it('should get featured blog posts', async () => {
        const response = await request(app)
          .get('/api/blog/featured')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });
    });

    describe('GET /api/blog/recent', () => {
      it('should get recent blog posts', async () => {
        const response = await request(app)
          .get('/api/blog/recent?limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
        expect(response.body.data.posts.length).toBeLessThanOrEqual(5);
      });
    });
  });

  // Admin routes tests
  describe('Admin Blog Routes', () => {
    describe('GET /admin/blog', () => {
      it('should get all blog posts for admin', async () => {
        const response = await request(app)
          .get('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should include unpublished posts for admin', async () => {
        const response = await request(app)
          .get('/admin/blog?status=all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/admin/blog?status=DRAFT')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.posts.forEach(post => {
          expect(post.status).toBe('DRAFT');
        });
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/blog')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/blog')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/blog', () => {
      it('should create new blog post', async () => {
        const blogData = {
          title: 'Test Blog Create',
          content: 'This is a test blog post for creation.',
          excerpt: 'Test creation excerpt',
          slug: 'test-blog-create',
          category: 'lifestyle',
          tags: ['test', 'create'],
          status: 'DRAFT',
          isFeatured: false,
          isPublished: false
        };

        const response = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.title).toBe(blogData.title);
        expect(response.body.data.slug).toBe(blogData.slug);
        expect(response.body.data.status).toBe('DRAFT');
      });

      it('should auto-generate slug if not provided', async () => {
        const blogData = {
          title: 'Auto Generated Slug Post',
          content: 'This post should have an auto-generated slug.',
          excerpt: 'Auto slug excerpt',
          category: 'tech',
          status: 'DRAFT'
        };

        const response = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.slug).toBe('auto-generated-slug-post');
      });

      it('should fail with duplicate slug', async () => {
        const blogData = {
          title: 'Duplicate Slug Post',
          content: 'This post has a duplicate slug.',
          slug: 'test-blog-post', // Duplicate slug
          category: 'fashion',
          status: 'DRAFT'
        };

        const response = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with missing required fields', async () => {
        const blogData = {
          content: 'Missing title and other required fields'
        };

        const response = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const blogData = {
          title: 'User Blog Post',
          content: 'This should fail for non-admin users.',
          category: 'test'
        };

        const response = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${authToken}`)
          .send(blogData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/blog/:id', () => {
      it('should get blog post by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testBlogId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/blog/:id', () => {
      it('should update blog post successfully', async () => {
        const updateData = {
          title: 'Updated Test Blog Post',
          content: 'This is updated content.',
          excerpt: 'Updated excerpt',
          category: 'updated-category',
          isFeatured: true
        };

        const response = await request(app)
          .put(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Updated Test Blog Post');
        expect(response.body.data.content).toBe('This is updated content.');
        expect(response.body.data.isFeatured).toBe(true);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          title: '' // Empty title
        };

        const response = await request(app)
          .put(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent blog post', async () => {
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put('/admin/blog/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Blog post not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/blog/:id', () => {
      it('should delete blog post successfully', async () => {
        // Create a blog post to delete
        const blogData = {
          title: 'Test Blog Delete',
          content: 'This blog post will be deleted.',
          slug: 'test-blog-delete',
          category: 'test',
          status: 'DRAFT'
        };

        const createResponse = await request(app)
          .post('/admin/blog')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blogData);

        const blogToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/blog/${blogToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent blog post', async () => {
        const response = await request(app)
          .delete('/admin/blog/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Blog post not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/blog/${testBlogId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/blog/:id/publish', () => {
      it('should publish blog post', async () => {
        const response = await request(app)
          .put(`/admin/blog/${testBlogId}/publish`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PUBLISHED');
        expect(response.body.data.isPublished).toBe(true);
        expect(response.body.data.publishedAt).toBeTruthy();
      });

      it('should fail for already published post', async () => {
        const response = await request(app)
          .put(`/admin/blog/${testBlogId}/publish`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already published');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .put(`/admin/blog/${testBlogId}/publish`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/blog/:id/unpublish', () => {
      it('should unpublish blog post', async () => {
        const response = await request(app)
          .put(`/admin/blog/${testBlogId}/unpublish`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('DRAFT');
        expect(response.body.data.isPublished).toBe(false);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .put(`/admin/blog/${testBlogId}/unpublish`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('POST /admin/blog/:id/image', () => {
      it('should fail without file upload', async () => {
        const response = await request(app)
          .post(`/admin/blog/${testBlogId}/image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('file');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .post(`/admin/blog/${testBlogId}/image`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/blog/analytics', () => {
      it('should get blog analytics', async () => {
        const response = await request(app)
          .get('/admin/blog/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
        expect(response.body.data).toHaveProperty('publishedPosts');
        expect(response.body.data).toHaveProperty('draftPosts');
        expect(response.body.data).toHaveProperty('totalViews');
        expect(response.body.data).toHaveProperty('popularPosts');
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/admin/blog/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/blog/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
