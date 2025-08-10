/**
 * Cart Module Tests
 * Tests for shopping cart operations - add, update, remove items
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Cart Module', () => {
  let authToken;
  let testUserId;
  let testProductId;
  let testVariantId;
  let testCategoryId;
  let cartItemId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.cartItem.deleteMany({
      where: { user: { email: { contains: 'carttest' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Cart Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Cart Test' } }
    });

    // Create test user
    const userData = {
      firstName: 'Cart',
      lastName: 'User',
      email: 'carttest@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.token;
    testUserId = userResponse.body.data.user.id;

    // Create admin for setup
    const adminData = {
      firstName: 'Cart',
      lastName: 'Admin',
      email: 'cartadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    const adminToken = adminResponse.body.data.token;

    // Create test category
    const categoryData = {
      name: 'Cart Test Category',
      description: 'Test category for cart',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;

    // Create test product
    const productData = {
      name: 'Cart Test Product',
      description: 'Test product for cart',
      price: 99.99,
      categoryId: testCategoryId,
      sku: 'CART-TEST-PRODUCT',
      stock: 100,
      isActive: true
    };

    const productResponse = await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    testProductId = productResponse.body.data.id;

    // Create test variant
    const variantData = {
      productId: testProductId,
      name: 'Size M',
      value: 'Medium',
      price: 99.99,
      stock: 50,
      sku: 'CART-TEST-VARIANT-M'
    };

    const variantResponse = await request(app)
      .post('/admin/variants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(variantData);

    testVariantId = variantResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.cartItem.deleteMany({
      where: { user: { email: { contains: 'carttest' } } }
    });
    await prisma.variant.deleteMany({
      where: { product: { name: { contains: 'Cart Test' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Cart Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Cart Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'carttest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/cart', () => {
    it('should get empty cart initially', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBe(0);
      expect(response.body.data.summary.totalItems).toBe(0);
      expect(response.body.data.summary.totalAmount).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add product to cart', async () => {
      const cartData = {
        productId: testProductId,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.productId).toBe(testProductId);
      expect(response.body.data.quantity).toBe(2);

      cartItemId = response.body.data.id;
    });

    it('should add variant to cart', async () => {
      const cartData = {
        productId: testProductId,
        variantId: testVariantId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variantId).toBe(testVariantId);
      expect(response.body.data.quantity).toBe(1);
    });

    it('should update quantity if item already exists', async () => {
      const cartData = {
        productId: testProductId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(3); // 2 + 1
    });

    it('should fail with invalid product ID', async () => {
      const cartData = {
        productId: 999999,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail with invalid quantity', async () => {
      const cartData = {
        productId: testProductId,
        quantity: 0
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with insufficient stock', async () => {
      const cartData = {
        productId: testProductId,
        quantity: 1000 // More than available stock
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('insufficient stock');
    });

    it('should fail without authentication', async () => {
      const cartData = {
        productId: testProductId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/items')
        .send(cartData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/cart (with items)', () => {
    it('should get cart with items', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.summary.totalItems).toBeGreaterThan(0);
      expect(response.body.data.summary.totalAmount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    it('should update cart item quantity', async () => {
      const updateData = {
        quantity: 5
      };

      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(5);
    });

    it('should fail with invalid quantity', async () => {
      const updateData = {
        quantity: -1
      };

      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with non-existent cart item', async () => {
      const updateData = {
        quantity: 2
      };

      const response = await request(app)
        .put('/api/cart/items/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart item not found');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        quantity: 2
      };

      const response = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed from cart');
    });

    it('should fail with non-existent cart item', async () => {
      const response = await request(app)
        .delete('/api/cart/items/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart item not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/cart/items/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Add some items to cart for testing
      const cartData = {
        productId: testProductId,
        quantity: 1
      };

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Cart cleared');

      // Verify cart is empty
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.items.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/cart/sync', () => {
    it('should sync cart with provided items', async () => {
      const syncData = {
        items: [
          {
            productId: testProductId,
            quantity: 2
          },
          {
            productId: testProductId,
            variantId: testVariantId,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items.length).toBe(2);
    });

    it('should fail with invalid sync data', async () => {
      const syncData = {
        items: [
          {
            productId: 999999, // Invalid product
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail without authentication', async () => {
      const syncData = {
        items: []
      };

      const response = await request(app)
        .post('/api/cart/sync')
        .send(syncData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/cart/count', () => {
    it('should get cart items count', async () => {
      const response = await request(app)
        .get('/api/cart/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.count).toBe('number');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/cart/count')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/cart/validate', () => {
    it('should validate cart items availability', async () => {
      const response = await request(app)
        .post('/api/cart/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data).toHaveProperty('issues');
      expect(typeof response.body.data.valid).toBe('boolean');
      expect(Array.isArray(response.body.data.issues)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/cart/validate')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });
});
