/**
 * Product Module Tests
 * Tests for product CRUD operations, search, filtering, and image uploads
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Product Module', () => {
  let authToken;
  let adminToken;
  let testProductId;
  let testCategoryId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { name: { contains: 'Test Product' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Test Category' } }
    });

    // Create test user
    const userData = {
      firstName: 'Product',
      lastName: 'User',
      email: 'productuser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;

    // Create admin user
    const adminData = {
      firstName: 'Product',
      lastName: 'Admin',
      email: 'productadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;

    // Create test category
    const categoryData = {
      name: 'Test Category Product',
      description: 'Test category for products',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { name: { contains: 'Test Product' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Test Category' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'product' } }
    });
    await prisma.$disconnect();
  });

  // User routes tests
  describe('User Product Routes', () => {
    describe('GET /api/products', () => {
      it('should get all products for users', async () => {
        const response = await request(app)
          .get('/api/products')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/products?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
        expect(response.body.data.pagination).toHaveProperty('total');
      });

      it('should support search', async () => {
        const response = await request(app)
          .get('/api/products?search=shirt')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get(`/api/products?categoryId=${testCategoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should filter by price range', async () => {
        const response = await request(app)
          .get('/api/products?minPrice=10&maxPrice=100')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should sort products', async () => {
        const response = await request(app)
          .get('/api/products?sortBy=price&sortOrder=asc')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should get only active products by default', async () => {
        const response = await request(app)
          .get('/api/products')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.products.forEach(product => {
          expect(product.isActive).toBe(true);
        });
      });
    });

    describe('GET /api/products/:id', () => {
      it('should get product by ID', async () => {
        // First create a product via admin
        const productData = {
          name: 'Test Product View',
          description: 'Test product for viewing',
          price: 99.99,
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-VIEW',
          stock: 10,
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData);

        testProductId = createResponse.body.data.id;

        const response = await request(app)
          .get(`/api/products/${testProductId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe('Test Product View');
      });

      it('should increment view count', async () => {
        const response1 = await request(app)
          .get(`/api/products/${testProductId}`)
          .expect(200);

        const initialViews = response1.body.data.views || 0;

        const response2 = await request(app)
          .get(`/api/products/${testProductId}`)
          .expect(200);

        expect(response2.body.data.views).toBe(initialViews + 1);
      });

      it('should fail with invalid product ID', async () => {
        const response = await request(app)
          .get('/api/products/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent product', async () => {
        const response = await request(app)
          .get('/api/products/999999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Product not found');
      });
    });

    describe('GET /api/products/:id/related', () => {
      it('should get related products', async () => {
        const response = await request(app)
          .get(`/api/products/${testProductId}/related`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should limit related products', async () => {
        const response = await request(app)
          .get(`/api/products/${testProductId}/related?limit=5`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.products.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/products/featured', () => {
      it('should get featured products', async () => {
        const response = await request(app)
          .get('/api/products/featured')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });
    });

    describe('GET /api/products/trending', () => {
      it('should get trending products', async () => {
        const response = await request(app)
          .get('/api/products/trending')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });
    });
  });

  // Admin routes tests
  describe('Admin Product Routes', () => {
    describe('GET /admin/products', () => {
      it('should get all products for admin', async () => {
        const response = await request(app)
          .get('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should include inactive products for admin', async () => {
        const response = await request(app)
          .get('/admin/products?includeInactive=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/products')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('POST /admin/products', () => {
      it('should create new product', async () => {
        const productData = {
          name: 'Test Product Create',
          description: 'Test product for creation',
          price: 149.99,
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-CREATE',
          stock: 20,
          isActive: true,
          isFeatured: false
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(productData.name);
        expect(response.body.data.price).toBe(productData.price);
        expect(response.body.data.sku).toBe(productData.sku);
      });

      it('should fail with duplicate SKU', async () => {
        const productData = {
          name: 'Test Product Duplicate',
          description: 'Test product with duplicate SKU',
          price: 99.99,
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-CREATE', // Duplicate SKU
          stock: 10,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid category', async () => {
        const productData = {
          name: 'Test Product Invalid Category',
          description: 'Test product with invalid category',
          price: 99.99,
          categoryId: 999999,
          sku: 'TEST-PRODUCT-INVALID-CAT',
          stock: 10,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Category not found');
      });

      it('should fail with missing required fields', async () => {
        const productData = {
          description: 'Missing name and other required fields'
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail with invalid price', async () => {
        const productData = {
          name: 'Test Product Invalid Price',
          description: 'Test product with invalid price',
          price: -10, // Negative price
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-INVALID-PRICE',
          stock: 10,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const productData = {
          name: 'Test Product',
          description: 'Test product description',
          price: 99.99,
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-USER',
          stock: 10
        };

        const response = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(productData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/products/:id', () => {
      it('should get product by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testProductId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/products/:id', () => {
      it('should update product successfully', async () => {
        const updateData = {
          name: 'Updated Test Product',
          description: 'Updated product description',
          price: 199.99,
          stock: 15,
          isFeatured: true
        };

        const response = await request(app)
          .put(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Test Product');
        expect(response.body.data.price).toBe(199.99);
        expect(response.body.data.stock).toBe(15);
        expect(response.body.data.isFeatured).toBe(true);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          price: -50 // Invalid negative price
        };

        const response = await request(app)
          .put(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent product', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put('/admin/products/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Product not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/products/:id', () => {
      it('should delete product successfully', async () => {
        // Create a product to delete
        const productData = {
          name: 'Test Product Delete',
          description: 'Test product for deletion',
          price: 99.99,
          categoryId: testCategoryId,
          sku: 'TEST-PRODUCT-DELETE',
          stock: 10,
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData);

        const productToDelete = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/admin/products/${productToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent product', async () => {
        const response = await request(app)
          .delete('/admin/products/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Product not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/products/${testProductId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('POST /admin/products/:id/images', () => {
      it('should fail without file upload', async () => {
        const response = await request(app)
          .post(`/admin/products/${testProductId}/images`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('file');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .post(`/admin/products/${testProductId}/images`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/products/:id/images/:imageId', () => {
      it('should fail for non-existent image', async () => {
        const response = await request(app)
          .delete(`/admin/products/${testProductId}/images/999999`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Image not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/products/${testProductId}/images/1`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/products/:id/stock', () => {
      it('should update product stock', async () => {
        const stockData = {
          stock: 50,
          operation: 'set' // or 'add', 'subtract'
        };

        const response = await request(app)
          .put(`/admin/products/${testProductId}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stockData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stock).toBe(50);
      });

      it('should fail with invalid stock operation', async () => {
        const stockData = {
          stock: 10,
          operation: 'invalid'
        };

        const response = await request(app)
          .put(`/admin/products/${testProductId}/stock`)
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
          .put(`/admin/products/${testProductId}/stock`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(stockData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
