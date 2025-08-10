/**
 * Feed Module Tests
 * Tests for social media feed integration and content management
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Feed Module', () => {
  let authToken;
  let adminToken;
  let testFeedId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.feedPost.deleteMany({
      where: { title: { contains: 'Test Feed' } }
    });

    // Create test user
    const userData = {
      firstName: 'Feed',
      lastName: 'User',
      email: 'feeduser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;

    // Create admin user
    const adminData = {
      firstName: 'Feed',
      lastName: 'Admin',
      email: 'feedadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.feedPost.deleteMany({
      where: { title: { contains: 'Test Feed' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'feed' } }
    });
    await prisma.$disconnect();
  });

  // Public routes tests
  describe('Public Feed Routes', () => {
    describe('GET /api/feed', () => {
      it('should get feed posts', async () => {
        const response = await request(app)
          .get('/api/feed')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/feed?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should filter by platform', async () => {
        const response = await request(app)
          .get('/api/feed?platform=instagram')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should filter by hashtag', async () => {
        const response = await request(app)
          .get('/api/feed?hashtag=fashion')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should sort posts by date', async () => {
        const response = await request(app)
          .get('/api/feed?sortBy=createdAt&sortOrder=desc')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });
    });

    describe('GET /api/feed/:id', () => {
      beforeEach(async () => {
        // Create a test feed post
        const feedData = {
          title: 'Test Feed Post',
          content: 'This is a test feed post content.',
          platform: 'instagram',
          platformPostId: 'test-post-123',
          imageUrl: 'https://example.com/image.jpg',
          hashtags: ['fashion', 'style'],
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData);

        testFeedId = createResponse.body.data.id;
      });

      it('should get feed post by ID', async () => {
        const response = await request(app)
          .get(`/api/feed/${testFeedId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testFeedId);
        expect(response.body.data.title).toBe('Test Feed Post');
      });

      it('should fail with invalid feed ID', async () => {
        const response = await request(app)
          .get('/api/feed/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent feed post', async () => {
        const response = await request(app)
          .get('/api/feed/999999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Feed post not found');
      });
    });

    describe('GET /api/feed/hashtags', () => {
      it('should get popular hashtags', async () => {
        const response = await request(app)
          .get('/api/feed/hashtags')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('hashtags');
        expect(Array.isArray(response.body.data.hashtags)).toBe(true);
      });

      it('should limit hashtags count', async () => {
        const response = await request(app)
          .get('/api/feed/hashtags?limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.hashtags.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/feed/platforms', () => {
      it('should get available platforms', async () => {
        const response = await request(app)
          .get('/api/feed/platforms')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('platforms');
        expect(Array.isArray(response.body.data.platforms)).toBe(true);
      });
    });
  });

  // Admin routes tests
  describe('Admin Feed Routes', () => {
    describe('GET /admin/feed', () => {
      it('should get all feed posts for admin', async () => {
        const response = await request(app)
          .get('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should include inactive posts for admin', async () => {
        const response = await request(app)
          .get('/admin/feed?includeInactive=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/feed')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/feed', () => {
      it('should create new feed post', async () => {
        const feedData = {
          title: 'Test Feed Create',
          content: 'This is a test feed post for creation.',
          platform: 'twitter',
          platformPostId: 'test-create-456',
          imageUrl: 'https://example.com/create.jpg',
          hashtags: ['test', 'create'],
          isActive: true
        };

        const response = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.title).toBe(feedData.title);
        expect(response.body.data.platform).toBe(feedData.platform);
        expect(response.body.data.platformPostId).toBe(feedData.platformPostId);
      });

      it('should fail with duplicate platform post ID', async () => {
        const feedData = {
          title: 'Duplicate Platform Post',
          content: 'This has a duplicate platform post ID.',
          platform: 'instagram',
          platformPostId: 'test-post-123', // Duplicate
          imageUrl: 'https://example.com/duplicate.jpg',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid platform', async () => {
        const feedData = {
          title: 'Invalid Platform Post',
          content: 'This has an invalid platform.',
          platform: 'invalid_platform',
          platformPostId: 'test-invalid-789',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with missing required fields', async () => {
        const feedData = {
          content: 'Missing title and platform'
        };

        const response = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const feedData = {
          title: 'User Feed Post',
          content: 'This should fail for non-admin users.',
          platform: 'instagram',
          platformPostId: 'user-test-123'
        };

        const response = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .send(feedData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/feed/:id', () => {
      it('should get feed post by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testFeedId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/feed/:id', () => {
      it('should update feed post successfully', async () => {
        const updateData = {
          title: 'Updated Test Feed Post',
          content: 'This is updated content.',
          hashtags: ['updated', 'test'],
          isActive: false
        };

        const response = await request(app)
          .put(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Updated Test Feed Post');
        expect(response.body.data.content).toBe('This is updated content.');
        expect(response.body.data.isActive).toBe(false);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          title: '' // Empty title
        };

        const response = await request(app)
          .put(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent feed post', async () => {
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put('/admin/feed/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Feed post not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/feed/:id', () => {
      it('should delete feed post successfully', async () => {
        // Create a feed post to delete
        const feedData = {
          title: 'Test Feed Delete',
          content: 'This feed post will be deleted.',
          platform: 'facebook',
          platformPostId: 'test-delete-789',
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/feed')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(feedData);

        const feedToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/feed/${feedToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent feed post', async () => {
        const response = await request(app)
          .delete('/admin/feed/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Feed post not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/feed/${testFeedId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('POST /admin/feed/sync', () => {
      it('should sync feed from external platforms', async () => {
        const syncData = {
          platform: 'instagram',
          hashtags: ['fashion', 'style'],
          limit: 10
        };

        const response = await request(app)
          .post('/admin/feed/sync')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(syncData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('synced');
        expect(response.body.data).toHaveProperty('skipped');
        expect(typeof response.body.data.synced).toBe('number');
      });

      it('should fail with invalid platform', async () => {
        const syncData = {
          platform: 'invalid_platform',
          hashtags: ['test']
        };

        const response = await request(app)
          .post('/admin/feed/sync')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(syncData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const syncData = {
          platform: 'instagram',
          hashtags: ['test']
        };

        const response = await request(app)
          .post('/admin/feed/sync')
          .set('Authorization', `Bearer ${authToken}`)
          .send(syncData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/feed/:id/toggle', () => {
      it('should toggle feed post status', async () => {
        const response = await request(app)
          .put(`/admin/feed/${testFeedId}/toggle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('isActive');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .put(`/admin/feed/${testFeedId}/toggle`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/feed/analytics', () => {
      it('should get feed analytics', async () => {
        const response = await request(app)
          .get('/admin/feed/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
        expect(response.body.data).toHaveProperty('activePosts');
        expect(response.body.data).toHaveProperty('platformBreakdown');
        expect(response.body.data).toHaveProperty('popularHashtags');
        expect(response.body.data).toHaveProperty('engagementStats');
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/admin/feed/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/feed/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
