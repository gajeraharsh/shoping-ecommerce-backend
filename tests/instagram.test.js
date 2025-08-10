/**
 * Instagram Module Tests
 * Tests for Instagram integration and content management
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Instagram Module', () => {
  let authToken;
  let adminToken;
  let testInstagramId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.instagramPost.deleteMany({
      where: { caption: { contains: 'Test Instagram' } }
    });

    // Create test user
    const userData = {
      firstName: 'Instagram',
      lastName: 'User',
      email: 'instagramuser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;

    // Create admin user
    const adminData = {
      firstName: 'Instagram',
      lastName: 'Admin',
      email: 'instagramadmin@example.com',
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
    await prisma.instagramPost.deleteMany({
      where: { caption: { contains: 'Test Instagram' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'instagram' } }
    });
    await prisma.$disconnect();
  });

  // Public routes tests
  describe('Public Instagram Routes', () => {
    describe('GET /api/instagram', () => {
      it('should get Instagram posts', async () => {
        const response = await request(app)
          .get('/api/instagram')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/instagram?page=1&limit=12')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should filter by hashtag', async () => {
        const response = await request(app)
          .get('/api/instagram?hashtag=fashion')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should sort posts by date', async () => {
        const response = await request(app)
          .get('/api/instagram?sortBy=createdAt&sortOrder=desc')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should only return active posts', async () => {
        const response = await request(app)
          .get('/api/instagram')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.posts.forEach(post => {
          expect(post.isActive).toBe(true);
        });
      });
    });

    describe('GET /api/instagram/:id', () => {
      beforeEach(async () => {
        // Create a test Instagram post
        const instagramData = {
          instagramId: 'test-instagram-123',
          caption: 'Test Instagram Post',
          imageUrl: 'https://example.com/instagram.jpg',
          permalink: 'https://instagram.com/p/test123',
          hashtags: ['fashion', 'style'],
          likesCount: 100,
          commentsCount: 10,
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData);

        testInstagramId = createResponse.body.data.id;
      });

      it('should get Instagram post by ID', async () => {
        const response = await request(app)
          .get(`/api/instagram/${testInstagramId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testInstagramId);
        expect(response.body.data.caption).toBe('Test Instagram Post');
      });

      it('should fail with invalid Instagram ID', async () => {
        const response = await request(app)
          .get('/api/instagram/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent Instagram post', async () => {
        const response = await request(app)
          .get('/api/instagram/999999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Instagram post not found');
      });
    });

    describe('GET /api/instagram/hashtags', () => {
      it('should get popular hashtags', async () => {
        const response = await request(app)
          .get('/api/instagram/hashtags')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('hashtags');
        expect(Array.isArray(response.body.data.hashtags)).toBe(true);
      });

      it('should limit hashtags count', async () => {
        const response = await request(app)
          .get('/api/instagram/hashtags?limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.hashtags.length).toBeLessThanOrEqual(10);
      });
    });

    describe('GET /api/instagram/recent', () => {
      it('should get recent Instagram posts', async () => {
        const response = await request(app)
          .get('/api/instagram/recent?limit=6')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
        expect(response.body.data.posts.length).toBeLessThanOrEqual(6);
      });
    });
  });

  // Admin routes tests
  describe('Admin Instagram Routes', () => {
    describe('GET /admin/instagram', () => {
      it('should get all Instagram posts for admin', async () => {
        const response = await request(app)
          .get('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('posts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should include inactive posts for admin', async () => {
        const response = await request(app)
          .get('/admin/instagram?includeInactive=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.posts)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/instagram')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/instagram')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/instagram', () => {
      it('should create new Instagram post', async () => {
        const instagramData = {
          instagramId: 'test-create-456',
          caption: 'Test Instagram Create',
          imageUrl: 'https://example.com/create.jpg',
          permalink: 'https://instagram.com/p/create456',
          hashtags: ['test', 'create'],
          likesCount: 50,
          commentsCount: 5,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.instagramId).toBe(instagramData.instagramId);
        expect(response.body.data.caption).toBe(instagramData.caption);
      });

      it('should fail with duplicate Instagram ID', async () => {
        const instagramData = {
          instagramId: 'test-instagram-123', // Duplicate
          caption: 'Duplicate Instagram Post',
          imageUrl: 'https://example.com/duplicate.jpg',
          permalink: 'https://instagram.com/p/duplicate',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid URL format', async () => {
        const instagramData = {
          instagramId: 'test-invalid-url',
          caption: 'Invalid URL Post',
          imageUrl: 'invalid-url',
          permalink: 'invalid-permalink',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with missing required fields', async () => {
        const instagramData = {
          caption: 'Missing required fields'
        };

        const response = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const instagramData = {
          instagramId: 'user-test-789',
          caption: 'User Instagram Post',
          imageUrl: 'https://example.com/user.jpg',
          permalink: 'https://instagram.com/p/user789'
        };

        const response = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${authToken}`)
          .send(instagramData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/instagram/:id', () => {
      it('should get Instagram post by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testInstagramId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/instagram/:id', () => {
      it('should update Instagram post successfully', async () => {
        const updateData = {
          caption: 'Updated Test Instagram Post',
          hashtags: ['updated', 'test'],
          likesCount: 200,
          commentsCount: 20,
          isActive: false
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.caption).toBe('Updated Test Instagram Post');
        expect(response.body.data.likesCount).toBe(200);
        expect(response.body.data.isActive).toBe(false);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          likesCount: -10 // Invalid negative count
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent Instagram post', async () => {
        const updateData = {
          caption: 'Updated Caption'
        };

        const response = await request(app)
          .put('/admin/instagram/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Instagram post not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          caption: 'Updated Caption'
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/instagram/:id', () => {
      it('should delete Instagram post successfully', async () => {
        // Create an Instagram post to delete
        const instagramData = {
          instagramId: 'test-delete-789',
          caption: 'Test Instagram Delete',
          imageUrl: 'https://example.com/delete.jpg',
          permalink: 'https://instagram.com/p/delete789',
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/instagram')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(instagramData);

        const instagramToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/instagram/${instagramToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent Instagram post', async () => {
        const response = await request(app)
          .delete('/admin/instagram/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Instagram post not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/instagram/${testInstagramId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('POST /admin/instagram/sync', () => {
      it('should sync Instagram posts from API', async () => {
        const syncData = {
          hashtags: ['fashion', 'style'],
          limit: 20
        };

        const response = await request(app)
          .post('/admin/instagram/sync')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(syncData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('synced');
        expect(response.body.data).toHaveProperty('skipped');
        expect(typeof response.body.data.synced).toBe('number');
      });

      it('should fail with invalid sync parameters', async () => {
        const syncData = {
          limit: -5 // Invalid negative limit
        };

        const response = await request(app)
          .post('/admin/instagram/sync')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(syncData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const syncData = {
          hashtags: ['test'],
          limit: 10
        };

        const response = await request(app)
          .post('/admin/instagram/sync')
          .set('Authorization', `Bearer ${authToken}`)
          .send(syncData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/instagram/:id/toggle', () => {
      it('should toggle Instagram post status', async () => {
        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}/toggle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('isActive');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}/toggle`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/instagram/:id/stats', () => {
      it('should update Instagram post statistics', async () => {
        const statsData = {
          likesCount: 300,
          commentsCount: 25,
          sharesCount: 15
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}/stats`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statsData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.likesCount).toBe(300);
        expect(response.body.data.commentsCount).toBe(25);
      });

      it('should fail with invalid statistics', async () => {
        const statsData = {
          likesCount: -50 // Invalid negative count
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}/stats`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statsData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const statsData = {
          likesCount: 100
        };

        const response = await request(app)
          .put(`/admin/instagram/${testInstagramId}/stats`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statsData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/instagram/analytics', () => {
      it('should get Instagram analytics', async () => {
        const response = await request(app)
          .get('/admin/instagram/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
        expect(response.body.data).toHaveProperty('activePosts');
        expect(response.body.data).toHaveProperty('totalLikes');
        expect(response.body.data).toHaveProperty('totalComments');
        expect(response.body.data).toHaveProperty('popularHashtags');
        expect(response.body.data).toHaveProperty('engagementRate');
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/admin/instagram/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPosts');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/instagram/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
