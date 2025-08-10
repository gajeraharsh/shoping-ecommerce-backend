/**
 * Order Module Tests
 * Tests for order creation, management, status updates, and payment processing
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Order Module', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let testProductId;
  let testOrderId;
  let testCategoryId;
  let testAddressId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.order.deleteMany({
      where: { user: { email: { contains: 'ordertest' } } }
    });

    // Create test user
    const userData = {
      firstName: 'Order',
      lastName: 'User',
      email: 'ordertest@example.com',
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
      firstName: 'Order',
      lastName: 'Admin',
      email: 'orderadmin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'ADMIN'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.accessToken;

    // Create test category and product
    const categoryData = {
      name: 'Order Test Category',
      description: 'Test category for orders',
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);

    testCategoryId = categoryResponse.body.data.id;

    const productData = {
      name: 'Order Test Product',
      description: 'Test product for orders',
      price: 99.99,
      categoryId: testCategoryId,
      sku: 'ORDER-TEST-PRODUCT',
      stock: 100,
      isActive: true
    };

    const productResponse = await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    testProductId = productResponse.body.data.id;

    // Create test address
    const addressData = {
      type: 'SHIPPING',
      firstName: 'Order',
      lastName: 'User',
      addressLine1: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      phone: '+1234567890'
    };

    const addressResponse = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send(addressData);

    testAddressId = addressResponse.body.data.id;

    // Add item to cart for order creation
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProductId,
        quantity: 2
      });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { contains: 'ordertest' } } } }
    });
    await prisma.order.deleteMany({
      where: { user: { email: { contains: 'ordertest' } } }
    });
    await prisma.address.deleteMany({
      where: { user: { email: { contains: 'ordertest' } } }
    });
    await prisma.cartItem.deleteMany({
      where: { user: { email: { contains: 'ordertest' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Order Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Order Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'ordertest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/orders', () => {
    it('should get empty orders list initially', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      const orderData = {
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        paymentMethod: 'CARD',
        notes: 'Test order notes'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.paymentMethod).toBe('CARD');

      testOrderId = response.body.data.id;
    });

    it('should fail with empty cart', async () => {
      // Clear cart first
      await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`);

      const orderData = {
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        paymentMethod: 'CARD'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart is empty');
    });

    it('should fail with invalid address', async () => {
      // Add item back to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });

      const orderData = {
        shippingAddressId: 999999,
        billingAddressId: testAddressId,
        paymentMethod: 'CARD'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    it('should fail with invalid payment method', async () => {
      const orderData = {
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        paymentMethod: 'INVALID_METHOD'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const orderData = {
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        paymentMethod: 'CARD'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(testOrderId);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('items');
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should fail to cancel non-pending order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be cancelled');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrderId}/cancel`)
        .send({ reason: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/orders/:id/payment', () => {
    beforeEach(async () => {
      // Create a new pending order for payment tests
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });

      const orderData = {
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        paymentMethod: 'CARD'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      testOrderId = orderResponse.body.data.id;
    });

    it('should process payment for order', async () => {
      const paymentData = {
        paymentMethod: 'CARD',
        cardToken: 'test-card-token',
        amount: 99.99
      };

      const response = await request(app)
        .post(`/api/orders/${testOrderId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentStatus');
    });

    it('should fail with invalid payment data', async () => {
      const paymentData = {
        paymentMethod: 'CARD',
        amount: -10 // Invalid amount
      };

      const response = await request(app)
        .post(`/api/orders/${testOrderId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const paymentData = {
        paymentMethod: 'CARD',
        cardToken: 'test-token',
        amount: 99.99
      };

      const response = await request(app)
        .post(`/api/orders/${testOrderId}/payment`)
        .send(paymentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  // Admin routes tests
  describe('Admin Order Management', () => {
    describe('GET /admin/orders', () => {
      it('should get all orders for admin', async () => {
        const response = await request(app)
          .get('/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('orders');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      });

      it('should support search by order number', async () => {
        const response = await request(app)
          .get('/admin/orders?search=ORD')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/admin/orders?status=PENDING')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/orders/:id', () => {
      it('should get order details for admin', async () => {
        const response = await request(app)
          .get(`/admin/orders/${testOrderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testOrderId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/orders/${testOrderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/orders/:id/status', () => {
      it('should update order status', async () => {
        const statusData = {
          status: 'PROCESSING',
          notes: 'Order is being processed'
        };

        const response = await request(app)
          .put(`/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statusData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PROCESSING');
      });

      it('should fail with invalid status', async () => {
        const statusData = {
          status: 'INVALID_STATUS'
        };

        const response = await request(app)
          .put(`/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(statusData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const statusData = {
          status: 'SHIPPED'
        };

        const response = await request(app)
          .put(`/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statusData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/orders/:id/shipping', () => {
      it('should update shipping information', async () => {
        const shippingData = {
          trackingNumber: 'TRACK123456',
          carrier: 'FedEx',
          estimatedDelivery: '2024-01-15'
        };

        const response = await request(app)
          .put(`/admin/orders/${testOrderId}/shipping`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(shippingData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.trackingNumber).toBe('TRACK123456');
      });

      it('should fail for non-admin users', async () => {
        const shippingData = {
          trackingNumber: 'TRACK123456'
        };

        const response = await request(app)
          .put(`/admin/orders/${testOrderId}/shipping`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(shippingData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('GET /admin/orders/analytics', () => {
      it('should get order analytics', async () => {
        const response = await request(app)
          .get('/admin/orders/analytics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalOrders');
        expect(response.body.data).toHaveProperty('totalRevenue');
        expect(response.body.data).toHaveProperty('statusBreakdown');
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/admin/orders/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalOrders');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/orders/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
