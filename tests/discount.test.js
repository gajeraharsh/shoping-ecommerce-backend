/**
 * Discount Module Tests
 * Tests for discount code management, validation, and application
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Discount Module', () => {
  let authToken;
  let adminToken;
  let testDiscountId;
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.discount.deleteMany({
      where: { code: { contains: 'TEST' } }
    });

    // Create test user
    const userData = {
      firstName: 'Discount',
      lastName: 'User',
      email: 'discountuser@example.com',
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
      firstName: 'Discount',
      lastName: 'Admin',
      email: 'discountadmin@example.com',
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
    await prisma.discount.deleteMany({
      where: { code: { contains: 'TEST' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'discount' } }
    });
    await prisma.$disconnect();
  });

  // Public routes tests
  describe('Public Discount Routes', () => {
    describe('POST /api/discounts/validate', () => {
      beforeEach(async () => {
        // Create a test discount
        const discountData = {
          code: 'TEST10',
          type: 'PERCENTAGE',
          value: 10,
          description: 'Test 10% discount',
          minOrderAmount: 50,
          maxDiscountAmount: 20,
          usageLimit: 100,
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        };

        const createResponse = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData);

        testDiscountId = createResponse.body.data.id;
      });

      it('should validate valid discount code', async () => {
        const validateData = {
          code: 'TEST10',
          orderAmount: 100
        };

        const response = await request(app)
          .post('/api/discounts/validate')
          .send(validateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('valid');
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data).toHaveProperty('discount');
        expect(response.body.data).toHaveProperty('discountAmount');
      });

      it('should fail with invalid discount code', async () => {
        const validateData = {
          code: 'INVALID',
          orderAmount: 100
        };

        const response = await request(app)
          .post('/api/discounts/validate')
          .send(validateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Discount code not found');
      });

      it('should fail with order amount below minimum', async () => {
        const validateData = {
          code: 'TEST10',
          orderAmount: 30 // Below minimum of 50
        };

        const response = await request(app)
          .post('/api/discounts/validate')
          .send(validateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('minimum order amount');
      });

      it('should fail with missing required fields', async () => {
        const validateData = {
          code: 'TEST10'
          // Missing orderAmount
        };

        const response = await request(app)
          .post('/api/discounts/validate')
          .send(validateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });
    });

    describe('GET /api/discounts/public', () => {
      it('should get public discount codes', async () => {
        const response = await request(app)
          .get('/api/discounts/public')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('discounts');
        expect(Array.isArray(response.body.data.discounts)).toBe(true);
      });

      it('should only return active and public discounts', async () => {
        const response = await request(app)
          .get('/api/discounts/public')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.discounts.forEach(discount => {
          expect(discount.isActive).toBe(true);
          expect(discount.isPublic).toBe(true);
        });
      });
    });
  });

  // Admin routes tests
  describe('Admin Discount Routes', () => {
    describe('GET /admin/discounts', () => {
      it('should get all discounts for admin', async () => {
        const response = await request(app)
          .get('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('discounts');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.discounts)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/admin/discounts?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should support search by code', async () => {
        const response = await request(app)
          .get('/admin/discounts?search=TEST')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.discounts)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/admin/discounts?status=active')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.discounts)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/discounts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/discounts')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/discounts', () => {
      it('should create percentage discount', async () => {
        const discountData = {
          code: 'TEST20',
          type: 'PERCENTAGE',
          value: 20,
          description: 'Test 20% discount',
          minOrderAmount: 100,
          maxDiscountAmount: 50,
          usageLimit: 50,
          isActive: true,
          isPublic: false,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.code).toBe('TEST20');
        expect(response.body.data.type).toBe('PERCENTAGE');
        expect(response.body.data.value).toBe(20);
      });

      it('should create fixed amount discount', async () => {
        const discountData = {
          code: 'FIXED25',
          type: 'FIXED_AMOUNT',
          value: 25,
          description: 'Test $25 off discount',
          minOrderAmount: 75,
          usageLimit: 25,
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe('FIXED25');
        expect(response.body.data.type).toBe('FIXED_AMOUNT');
        expect(response.body.data.value).toBe(25);
      });

      it('should fail with duplicate code', async () => {
        const discountData = {
          code: 'TEST10', // Duplicate code
          type: 'PERCENTAGE',
          value: 15,
          description: 'Duplicate test discount',
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid percentage value', async () => {
        const discountData = {
          code: 'INVALID',
          type: 'PERCENTAGE',
          value: 150, // Invalid percentage > 100
          description: 'Invalid percentage discount',
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with invalid date range', async () => {
        const discountData = {
          code: 'DATETEST',
          type: 'PERCENTAGE',
          value: 10,
          description: 'Invalid date range discount',
          isActive: true,
          validFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date().toISOString() // validUntil before validFrom
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with missing required fields', async () => {
        const discountData = {
          type: 'PERCENTAGE',
          value: 10
          // Missing code, description, validFrom, validUntil
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const discountData = {
          code: 'USERTEST',
          type: 'PERCENTAGE',
          value: 10,
          description: 'User test discount',
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(discountData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/discounts/:id', () => {
      it('should get discount by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testDiscountId);
      });

      it('should fail with invalid discount ID', async () => {
        const response = await request(app)
          .get('/admin/discounts/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent discount', async () => {
        const response = await request(app)
          .get('/admin/discounts/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Discount not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/discounts/:id', () => {
      it('should update discount successfully', async () => {
        const updateData = {
          description: 'Updated test discount',
          value: 15,
          maxDiscountAmount: 30,
          isPublic: true
        };

        const response = await request(app)
          .put(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe('Updated test discount');
        expect(response.body.data.value).toBe(15);
        expect(response.body.data.maxDiscountAmount).toBe(30);
        expect(response.body.data.isPublic).toBe(true);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          value: -10 // Invalid negative value
        };

        const response = await request(app)
          .put(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent discount', async () => {
        const updateData = {
          description: 'Updated description'
        };

        const response = await request(app)
          .put('/admin/discounts/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Discount not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/discounts/:id', () => {
      it('should delete discount successfully', async () => {
        // Create a discount to delete
        const discountData = {
          code: 'DELETE_TEST',
          type: 'PERCENTAGE',
          value: 5,
          description: 'Discount to delete',
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const createResponse = await request(app)
          .post('/admin/discounts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(discountData);

        const discountToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/discounts/${discountToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent discount', async () => {
        const response = await request(app)
          .delete('/admin/discounts/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Discount not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/discounts/${testDiscountId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/discounts/:id/usage', () => {
      it('should get discount usage statistics', async () => {
        const response = await request(app)
          .get(`/admin/discounts/${testDiscountId}/usage`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalUsage');
        expect(response.body.data).toHaveProperty('remainingUsage');
        expect(response.body.data).toHaveProperty('totalSavings');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/discounts/${testDiscountId}/usage`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/discounts/:id/toggle', () => {
      it('should toggle discount status', async () => {
        const response = await request(app)
          .put(`/admin/discounts/${testDiscountId}/toggle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('isActive');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .put(`/admin/discounts/${testDiscountId}/toggle`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/discounts/analytics', () => {
      it('should get discount analytics', async () => {
        const response = await request(app)
          .get('/admin/discounts/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalDiscounts');
        expect(response.body.data).toHaveProperty('activeDiscounts');
        expect(response.body.data).toHaveProperty('totalUsage');
        expect(response.body.data).toHaveProperty('totalSavings');
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/admin/discounts/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalDiscounts');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/discounts/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
