/**
 * Wishlist Module Tests
 * Tests for wishlist operations - add, remove, view items
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Wishlist Module', () => {
  let authToken;
  let testUserId;
  let testProductId;
  let testCategoryId;
  let wishlistItemId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.wishlistItem.deleteMany({
      where: { user: { email: { contains: 'wishlisttest' } } }
    });

    // Create test user
    const userData = {
      firstName: 'Wishlist',
      lastName: 'User',
      email: 'wishlisttest@example.com',
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
      firstName: 'Wishlist',
      lastName: 'Admin',
      email: 'wishlistadmin@example.com',
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
      name: 'Wishlist Test Category',
      description: 'Test category for wishlist',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;

    // Create test product
    const productData = {
      name: 'Wishlist Test Product',
      description: 'Test product for wishlist',
      price: 99.99,
      categoryId: testCategoryId,
      sku: 'WISHLIST-TEST-PRODUCT',
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
    await prisma.wishlistItem.deleteMany({
      where: { user: { email: { contains: 'wishlisttest' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Wishlist Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Wishlist Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'wishlisttest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/wishlist', () => {
    it('should get empty wishlist initially', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBe(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/wishlist?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/wishlist/items', () => {
    it('should add product to wishlist', async () => {
      const wishlistData = {
        productId: testProductId
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.productId).toBe(testProductId);
      expect(response.body.message).toContain('added to wishlist');

      wishlistItemId = response.body.data.id;
    });

    it('should fail to add duplicate product', async () => {
      const wishlistData = {
        productId: testProductId // Same product as above
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already in wishlist');
    });

    it('should fail with invalid product ID', async () => {
      const wishlistData = {
        productId: 999999
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail with missing product ID', async () => {
      const wishlistData = {};

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const wishlistData = {
        productId: testProductId
      };

      const response = await request(app)
        .post('/api/wishlist/items')
        .send(wishlistData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/wishlist (with items)', () => {
    it('should get wishlist with items', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.items[0]).toHaveProperty('product');
      expect(response.body.data.items[0].product.id).toBe(testProductId);
    });
  });

  describe('DELETE /api/wishlist/items/:id', () => {
    it('should remove item from wishlist', async () => {
      const response = await request(app)
        .delete(`/api/wishlist/items/${wishlistItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed from wishlist');
    });

    it('should fail with non-existent wishlist item', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Wishlist item not found');
    });

    it('should fail with invalid item ID', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/wishlist/products/:productId', () => {
    beforeEach(async () => {
      // Add item back to wishlist for testing
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    it('should remove product from wishlist by product ID', async () => {
      const response = await request(app)
        .delete(`/api/wishlist/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed from wishlist');
    });

    it('should fail with non-existent product', async () => {
      const response = await request(app)
        .delete('/api/wishlist/products/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not in wishlist');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/wishlist/products/${testProductId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/wishlist/clear', () => {
    beforeEach(async () => {
      // Add items to wishlist for testing
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    it('should clear entire wishlist', async () => {
      const response = await request(app)
        .delete('/api/wishlist/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Wishlist cleared');

      // Verify wishlist is empty
      const wishlistResponse = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(wishlistResponse.body.data.items.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/wishlist/clear')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/wishlist/move-to-cart', () => {
    beforeEach(async () => {
      // Add item to wishlist for testing
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    it('should move wishlist item to cart', async () => {
      const moveData = {
        productId: testProductId,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/wishlist/move-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('moved to cart');

      // Verify item is removed from wishlist
      const wishlistResponse = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(wishlistResponse.body.data.items.length).toBe(0);

      // Verify item is in cart
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.items.length).toBeGreaterThan(0);
    });

    it('should fail with invalid quantity', async () => {
      const moveData = {
        productId: testProductId,
        quantity: 0
      };

      const response = await request(app)
        .post('/api/wishlist/move-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with product not in wishlist', async () => {
      // Clear wishlist first
      await request(app)
        .delete('/api/wishlist/clear')
        .set('Authorization', `Bearer ${authToken}`);

      const moveData = {
        productId: testProductId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/wishlist/move-to-cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not in wishlist');
    });

    it('should fail without authentication', async () => {
      const moveData = {
        productId: testProductId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/wishlist/move-to-cart')
        .send(moveData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/wishlist/count', () => {
    beforeEach(async () => {
      // Add item to wishlist for testing
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    it('should get wishlist items count', async () => {
      const response = await request(app)
        .get('/api/wishlist/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.count).toBe('number');
      expect(response.body.data.count).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/wishlist/count')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/wishlist/check/:productId', () => {
    beforeEach(async () => {
      // Clear and add specific item to wishlist
      await request(app)
        .delete('/api/wishlist/clear')
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId });
    });

    it('should check if product is in wishlist', async () => {
      const response = await request(app)
        .get(`/api/wishlist/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inWishlist');
      expect(response.body.data.inWishlist).toBe(true);
    });

    it('should return false for product not in wishlist', async () => {
      // Remove the product from wishlist
      await request(app)
        .delete(`/api/wishlist/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/wishlist/check/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.inWishlist).toBe(false);
    });

    it('should fail with invalid product ID', async () => {
      const response = await request(app)
        .get('/api/wishlist/check/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/wishlist/check/${testProductId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/wishlist/bulk-add', () => {
    it('should add multiple products to wishlist', async () => {
      // First clear wishlist
      await request(app)
        .delete('/api/wishlist/clear')
        .set('Authorization', `Bearer ${authToken}`);

      const bulkData = {
        productIds: [testProductId]
      };

      const response = await request(app)
        .post('/api/wishlist/bulk-add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('added');
      expect(response.body.data).toHaveProperty('skipped');
      expect(response.body.data.added.length).toBe(1);
    });

    it('should skip duplicate products', async () => {
      const bulkData = {
        productIds: [testProductId] // Already in wishlist
      };

      const response = await request(app)
        .post('/api/wishlist/bulk-add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skipped.length).toBe(1);
    });

    it('should fail with invalid product IDs', async () => {
      const bulkData = {
        productIds: [999999]
      };

      const response = await request(app)
        .post('/api/wishlist/bulk-add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid product IDs');
    });

    it('should fail without authentication', async () => {
      const bulkData = {
        productIds: [testProductId]
      };

      const response = await request(app)
        .post('/api/wishlist/bulk-add')
        .send(bulkData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });
});
