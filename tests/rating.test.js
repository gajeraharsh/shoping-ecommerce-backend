/**
 * Rating Module Tests
 * Tests for product rating and review operations
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Rating Module', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let testProductId;
  let testRatingId;
  let testCategoryId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.rating.deleteMany({
      where: { user: { email: { contains: 'ratingtest' } } }
    });

    // Create test user
    const userData = {
      firstName: 'Rating',
      lastName: 'User',
      email: 'ratingtest@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;
    testUserId = userResponse.body.data.user.id;

    // Create admin user
    const adminData = {
      firstName: 'Rating',
      lastName: 'Admin',
      email: 'ratingadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;

    // Create test category and product
    const categoryData = {
      name: 'Rating Test Category',
      description: 'Test category for ratings',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;

    const productData = {
      name: 'Rating Test Product',
      description: 'Test product for ratings',
      price: 99.99,
      categoryId: testCategoryId,
      sku: 'RATING-TEST-PRODUCT',
      stock: 100,
      isActive: true
    };

    const productResponse = await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    testProductId = productResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.rating.deleteMany({
      where: { user: { email: { contains: 'ratingtest' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Rating Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Rating Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'ratingtest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/ratings', () => {
    it('should get all ratings', async () => {
      const response = await request(app)
        .get('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ratings');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.ratings)).toBe(true);
    });

    it('should filter by product ID', async () => {
      const response = await request(app)
        .get(`/api/ratings?productId=${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.ratings)).toBe(true);
    });

    it('should filter by rating value', async () => {
      const response = await request(app)
        .get('/api/ratings?rating=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.ratings)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/ratings?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/ratings')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/ratings', () => {
    it('should create new rating', async () => {
      const ratingData = {
        productId: testProductId,
        rating: 5,
        title: 'Excellent Product',
        comment: 'This product exceeded my expectations. Highly recommended!',
        wouldRecommend: true
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.productId).toBe(testProductId);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.title).toBe('Excellent Product');
      expect(response.body.data.wouldRecommend).toBe(true);

      testRatingId = response.body.data.id;
    });

    it('should fail with duplicate rating for same product', async () => {
      const ratingData = {
        productId: testProductId, // Same product as above
        rating: 4,
        title: 'Another Review',
        comment: 'Trying to rate the same product again'
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already rated this product');
    });

    it('should fail with invalid rating value', async () => {
      const ratingData = {
        productId: testProductId,
        rating: 6, // Invalid rating > 5
        title: 'Invalid Rating',
        comment: 'This should fail'
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with invalid product ID', async () => {
      const ratingData = {
        productId: 999999,
        rating: 5,
        title: 'Non-existent Product',
        comment: 'Rating for non-existent product'
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail with missing required fields', async () => {
      const ratingData = {
        productId: testProductId,
        title: 'Missing Rating'
        // Missing rating field
      };

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const ratingData = {
        productId: testProductId,
        rating: 5,
        title: 'Test Rating',
        comment: 'Test comment'
      };

      const response = await request(app)
        .post('/api/ratings')
        .send(ratingData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/ratings/:id', () => {
    it('should get rating by ID', async () => {
      const response = await request(app)
        .get(`/api/ratings/${testRatingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(testRatingId);
    });

    it('should fail with invalid rating ID', async () => {
      const response = await request(app)
        .get('/api/ratings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail for non-existent rating', async () => {
      const response = await request(app)
        .get('/api/ratings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rating not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/ratings/${testRatingId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/ratings/:id', () => {
    it('should update own rating', async () => {
      const updateData = {
        rating: 4,
        title: 'Updated Review',
        comment: 'Updated my review after using the product more.',
        wouldRecommend: false
      };

      const response = await request(app)
        .put(`/api/ratings/${testRatingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(4);
      expect(response.body.data.title).toBe('Updated Review');
      expect(response.body.data.wouldRecommend).toBe(false);
    });

    it('should fail with invalid rating value', async () => {
      const updateData = {
        rating: 0 // Invalid rating < 1
      };

      const response = await request(app)
        .put(`/api/ratings/${testRatingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail for non-existent rating', async () => {
      const updateData = {
        rating: 5,
        title: 'Updated'
      };

      const response = await request(app)
        .put('/api/ratings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rating not found');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        rating: 5,
        title: 'Updated'
      };

      const response = await request(app)
        .put(`/api/ratings/${testRatingId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/ratings/:id', () => {
    it('should delete own rating', async () => {
      const response = await request(app)
        .delete(`/api/ratings/${testRatingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should fail for non-existent rating', async () => {
      const response = await request(app)
        .delete('/api/ratings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rating not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/ratings/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/ratings/product/:productId/summary', () => {
    beforeEach(async () => {
      // Create a new rating for summary tests
      const ratingData = {
        productId: testProductId,
        rating: 5,
        title: 'Summary Test',
        comment: 'Test rating for summary'
      };

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData);
    });

    it('should get rating summary for product', async () => {
      const response = await request(app)
        .get(`/api/ratings/product/${testProductId}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('averageRating');
      expect(response.body.data).toHaveProperty('totalRatings');
      expect(response.body.data).toHaveProperty('ratingDistribution');
      expect(response.body.data).toHaveProperty('recommendationPercentage');
    });

    it('should fail with invalid product ID', async () => {
      const response = await request(app)
        .get('/api/ratings/product/invalid-id/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return empty summary for product with no ratings', async () => {
      const response = await request(app)
        .get('/api/ratings/product/999999/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRatings).toBe(0);
      expect(response.body.data.averageRating).toBe(0);
    });
  });

  describe('POST /api/ratings/:id/helpful', () => {
    beforeEach(async () => {
      // Create a new rating for helpful tests
      const ratingData = {
        productId: testProductId,
        rating: 4,
        title: 'Helpful Test',
        comment: 'Test rating for helpful feature'
      };

      const ratingResponse = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData);

      testRatingId = ratingResponse.body.data.id;
    });

    it('should mark rating as helpful', async () => {
      const response = await request(app)
        .post(`/api/ratings/${testRatingId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marked as helpful');
    });

    it('should fail to mark same rating as helpful twice', async () => {
      // First mark as helpful
      await request(app)
        .post(`/api/ratings/${testRatingId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to mark as helpful again
      const response = await request(app)
        .post(`/api/ratings/${testRatingId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already marked');
    });

    it('should fail for non-existent rating', async () => {
      const response = await request(app)
        .post('/api/ratings/999999/helpful')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rating not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/ratings/${testRatingId}/helpful`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/ratings/:id/helpful', () => {
    it('should remove helpful mark from rating', async () => {
      const response = await request(app)
        .delete(`/api/ratings/${testRatingId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('helpful mark removed');
    });

    it('should fail if rating not marked as helpful', async () => {
      const response = await request(app)
        .delete(`/api/ratings/${testRatingId}/helpful`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not marked as helpful');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/ratings/${testRatingId}/helpful`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  // Admin routes tests
  describe('Admin Rating Routes', () => {
    describe('GET /admin/ratings', () => {
      it('should get all ratings for admin', async () => {
        const response = await request(app)
          .get('/admin/ratings')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('ratings');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.ratings)).toBe(true);
      });

      it('should support search by title or comment', async () => {
        const response = await request(app)
          .get('/admin/ratings?search=test')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.ratings)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/admin/ratings?status=approved')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.ratings)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/ratings')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/ratings/:id/status', () => {
      it('should update rating status', async () => {
        const statusData = {
          status: 'APPROVED',
          moderatorNotes: 'Rating approved after review'
        };

        const response = await request(app)
          .put(`/admin/ratings/${testRatingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statusData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('APPROVED');
      });

      it('should fail with invalid status', async () => {
        const statusData = {
          status: 'INVALID_STATUS'
        };

        const response = await request(app)
          .put(`/admin/ratings/${testRatingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statusData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const statusData = {
          status: 'APPROVED'
        };

        const response = await request(app)
          .put(`/admin/ratings/${testRatingId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statusData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/ratings/:id', () => {
      it('should delete rating as admin', async () => {
        const response = await request(app)
          .delete(`/admin/ratings/${testRatingId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete('/admin/ratings/1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/ratings/analytics', () => {
      it('should get rating analytics', async () => {
        const response = await request(app)
          .get('/admin/ratings/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalRatings');
        expect(response.body.data).toHaveProperty('averageRating');
        expect(response.body.data).toHaveProperty('ratingsByStatus');
        expect(response.body.data).toHaveProperty('topRatedProducts');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/ratings/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
