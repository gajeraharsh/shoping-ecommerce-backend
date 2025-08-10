/**
 * Variant Module Tests
 * Tests for product variant CRUD operations
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Variant Module', () => {
  let authToken;
  let adminToken;
  let testProductId;
  let testVariantId;
  let testCategoryId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.variant.deleteMany({
      where: { product: { name: { contains: 'Variant Test' } } }
    });

    // Create test user
    const userData = {
      firstName: 'Variant',
      lastName: 'User',
      email: 'variantuser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;

    // Create admin user
    const adminData = {
      firstName: 'Variant',
      lastName: 'Admin',
      email: 'variantadmin@example.com',
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
      name: 'Variant Test Category',
      description: 'Test category for variants',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;

    const productData = {
      name: 'Variant Test Product',
      description: 'Test product for variants',
      price: 99.99,
      categoryId: testCategoryId,
      sku: 'VARIANT-TEST-PRODUCT',
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
    await prisma.variant.deleteMany({
      where: { product: { name: { contains: 'Variant Test' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Variant Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Variant Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'variant' } }
    });
    await prisma.$disconnect();
  });

  // User routes tests
  describe('User Variant Routes', () => {
    describe('GET /api/variants', () => {
      it('should get all variants for users', async () => {
        const response = await request(app)
          .get('/api/variants')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('variants');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.variants)).toBe(true);
      });

      it('should filter by product ID', async () => {
        const response = await request(app)
          .get(`/api/variants?productId=${testProductId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.variants)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/variants?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should get only active variants by default', async () => {
        const response = await request(app)
          .get('/api/variants')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.variants.forEach(variant => {
          expect(variant.isActive).toBe(true);
        });
      });
    });

    describe('GET /api/variants/:id', () => {
      it('should get variant by ID', async () => {
        // First create a variant via admin
        const variantData = {
          productId: testProductId,
          name: 'Size',
          value: 'Large',
          price: 109.99,
          stock: 50,
          sku: 'VARIANT-TEST-L',
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData);

        testVariantId = createResponse.body.data.id;

        const response = await request(app)
          .get(`/api/variants/${testVariantId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe('Size');
        expect(response.body.data.value).toBe('Large');
      });

      it('should fail with invalid variant ID', async () => {
        const response = await request(app)
          .get('/api/variants/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent variant', async () => {
        const response = await request(app)
          .get('/api/variants/999999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Variant not found');
      });
    });

    describe('GET /api/variants/product/:productId', () => {
      it('should get variants for a specific product', async () => {
        const response = await request(app)
          .get(`/api/variants/product/${testProductId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('variants');
        expect(Array.isArray(response.body.data.variants)).toBe(true);
      });

      it('should fail with invalid product ID', async () => {
        const response = await request(app)
          .get('/api/variants/product/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should return empty array for product with no variants', async () => {
        const response = await request(app)
          .get('/api/variants/product/999999')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.variants.length).toBe(0);
      });
    });
  });

  // Admin routes tests
  describe('Admin Variant Routes', () => {
    describe('GET /admin/variants', () => {
      it('should get all variants for admin', async () => {
        const response = await request(app)
          .get('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('variants');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.variants)).toBe(true);
      });

      it('should include inactive variants for admin', async () => {
        const response = await request(app)
          .get('/admin/variants?includeInactive=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.variants)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/variants')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/variants')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/variants', () => {
      it('should create new variant', async () => {
        const variantData = {
          productId: testProductId,
          name: 'Color',
          value: 'Red',
          price: 99.99,
          stock: 25,
          sku: 'VARIANT-TEST-RED',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(variantData.name);
        expect(response.body.data.value).toBe(variantData.value);
        expect(response.body.data.price).toBe(variantData.price);
      });

      it('should fail with duplicate SKU', async () => {
        const variantData = {
          productId: testProductId,
          name: 'Color',
          value: 'Blue',
          price: 99.99,
          stock: 25,
          sku: 'VARIANT-TEST-L', // Duplicate SKU
          isActive: true
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid product ID', async () => {
        const variantData = {
          productId: 999999,
          name: 'Size',
          value: 'Medium',
          price: 99.99,
          stock: 25,
          sku: 'VARIANT-TEST-INVALID',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Product not found');
      });

      it('should fail with missing required fields', async () => {
        const variantData = {
          productId: testProductId,
          name: 'Size'
          // Missing value, price, stock, sku
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with invalid price', async () => {
        const variantData = {
          productId: testProductId,
          name: 'Size',
          value: 'Small',
          price: -10, // Negative price
          stock: 25,
          sku: 'VARIANT-TEST-NEGATIVE',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const variantData = {
          productId: testProductId,
          name: 'Size',
          value: 'Medium',
          price: 99.99,
          stock: 25,
          sku: 'VARIANT-TEST-USER'
        };

        const response = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${authToken}`)
          .send(variantData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/variants/:id', () => {
      it('should get variant by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testVariantId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/variants/:id', () => {
      it('should update variant successfully', async () => {
        const updateData = {
          name: 'Updated Size',
          value: 'Extra Large',
          price: 119.99,
          stock: 30,
          isActive: false
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Size');
        expect(response.body.data.value).toBe('Extra Large');
        expect(response.body.data.price).toBe(119.99);
        expect(response.body.data.stock).toBe(30);
        expect(response.body.data.isActive).toBe(false);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          price: -50 // Invalid negative price
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent variant', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put('/admin/variants/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Variant not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/variants/:id', () => {
      it('should delete variant successfully', async () => {
        // Create a variant to delete
        const variantData = {
          productId: testProductId,
          name: 'Color',
          value: 'Green',
          price: 99.99,
          stock: 10,
          sku: 'VARIANT-TEST-DELETE',
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(variantData);

        const variantToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/variants/${variantToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent variant', async () => {
        const response = await request(app)
          .delete('/admin/variants/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Variant not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/variants/${testVariantId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/variants/:id/stock', () => {
      it('should update variant stock', async () => {
        const stockData = {
          stock: 100,
          operation: 'set' // or 'add', 'subtract'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stockData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stock).toBe(100);
      });

      it('should add to existing stock', async () => {
        const stockData = {
          stock: 20,
          operation: 'add'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stockData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stock).toBe(120); // 100 + 20
      });

      it('should subtract from existing stock', async () => {
        const stockData = {
          stock: 10,
          operation: 'subtract'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stockData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stock).toBe(110); // 120 - 10
      });

      it('should fail with invalid stock operation', async () => {
        const stockData = {
          stock: 10,
          operation: 'invalid'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stockData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const stockData = {
          stock: 10,
          operation: 'set'
        };

        const response = await request(app)
          .put(`/admin/variants/${testVariantId}/stock`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(stockData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('POST /admin/variants/bulk-create', () => {
      it('should create multiple variants', async () => {
        const bulkData = {
          productId: testProductId,
          variants: [
            {
              name: 'Size',
              value: 'XS',
              price: 89.99,
              stock: 15,
              sku: 'VARIANT-TEST-XS'
            },
            {
              name: 'Size',
              value: 'XXL',
              price: 129.99,
              stock: 10,
              sku: 'VARIANT-TEST-XXL'
            }
          ]
        };

        const response = await request(app)
          .post('/admin/variants/bulk-create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('created');
        expect(response.body.data.created.length).toBe(2);
      });

      it('should fail with invalid product ID', async () => {
        const bulkData = {
          productId: 999999,
          variants: [
            {
              name: 'Size',
              value: 'M',
              price: 99.99,
              stock: 20,
              sku: 'VARIANT-TEST-BULK-INVALID'
            }
          ]
        };

        const response = await request(app)
          .post('/admin/variants/bulk-create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Product not found');
      });

      it('should fail for non-admin users', async () => {
        const bulkData = {
          productId: testProductId,
          variants: []
        };

        const response = await request(app)
          .post('/admin/variants/bulk-create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bulkData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
