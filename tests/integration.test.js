/**
 * Integration Tests
 * Tests for end-to-end workflows and module interactions
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Integration Tests', () => {
  let userToken;
  let adminToken;
  let testUserId;
  let testProductId;
  let testCategoryId;
  let testOrderId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { contains: 'integration' } } } }
    });
    await prisma.order.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.cartItem.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.wishlistItem.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.rating.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.address.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration' } }
    });

    // Create test user
    const userData = {
      firstName: 'Integration',
      lastName: 'User',
      email: 'integrationuser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    userToken = userResponse.body.data.token;
    testUserId = userResponse.body.data.user.id;

    // Create admin user
    const adminData = {
      firstName: 'Integration',
      lastName: 'Admin',
      email: 'integrationadmin@example.com',
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
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { contains: 'integration' } } } }
    });
    await prisma.order.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.cartItem.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.wishlistItem.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.rating.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.address.deleteMany({
      where: { user: { email: { contains: 'integration' } } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.category.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration' } }
    });
    await prisma.$disconnect();
  });

  describe('Complete E-commerce Workflow', () => {
    it('should complete full shopping workflow', async () => {
      // 1. Admin creates category
      const categoryData = {
        name: 'Integration Test Category',
        description: 'Test category for integration',
        isActive: true
      };

      const categoryResponse = await request(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      testCategoryId = categoryResponse.body.data.id;

      // 2. Admin creates product
      const productData = {
        name: 'Integration Test Product',
        description: 'Test product for integration workflow',
        price: 99.99,
        categoryId: testCategoryId,
        sku: 'INTEGRATION-TEST-001',
        stock: 50,
        isActive: true
      };

      const productResponse = await request(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      testProductId = productResponse.body.data.id;

      // 3. User browses products
      const browseResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(browseResponse.body.success).toBe(true);
      expect(browseResponse.body.data.products.length).toBeGreaterThan(0);

      // 4. User views specific product
      const productViewResponse = await request(app)
        .get(`/api/products/${testProductId}`)
        .expect(200);

      expect(productViewResponse.body.success).toBe(true);
      expect(productViewResponse.body.data.name).toBe('Integration Test Product');

      // 5. User adds product to wishlist
      const wishlistResponse = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId })
        .expect(201);

      expect(wishlistResponse.body.success).toBe(true);

      // 6. User adds product to cart
      const cartResponse = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 2 })
        .expect(201);

      expect(cartResponse.body.success).toBe(true);
      expect(cartResponse.body.data.quantity).toBe(2);

      // 7. User creates shipping address
      const addressData = {
        type: 'SHIPPING',
        firstName: 'Integration',
        lastName: 'User',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country',
        phone: '+1234567890',
        isDefault: true
      };

      const addressResponse = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addressData)
        .expect(201);

      const addressId = addressResponse.body.data.id;

      // 8. User creates order
      const orderData = {
        shippingAddressId: addressId,
        billingAddressId: addressId,
        paymentMethod: 'CARD',
        notes: 'Integration test order'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.status).toBe('PENDING');
      testOrderId = orderResponse.body.data.id;

      // 9. Admin updates order status
      const statusUpdateResponse = await request(app)
        .put(`/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING', notes: 'Order is being processed' })
        .expect(200);

      expect(statusUpdateResponse.body.success).toBe(true);
      expect(statusUpdateResponse.body.data.status).toBe('PROCESSING');

      // 10. User views order
      const orderViewResponse = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderViewResponse.body.success).toBe(true);
      expect(orderViewResponse.body.data.status).toBe('PROCESSING');

      // 11. User rates the product (after order completion simulation)
      await request(app)
        .put(`/admin/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED' });

      const ratingResponse = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProductId,
          rating: 5,
          title: 'Great Product!',
          comment: 'Excellent quality and fast delivery.',
          wouldRecommend: true
        })
        .expect(201);

      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.rating).toBe(5);
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should handle authentication flow correctly', async () => {
      // 1. Register new user
      const newUserData = {
        firstName: 'Auth',
        lastName: 'Test',
        email: 'authtest@example.com',
        password: 'Password123!',
        phone: '+1987654321'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('token');

      const newUserToken = registerResponse.body.data.token;

      // 2. Login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('token');

      // 3. Access protected route
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe('authtest@example.com');

      // 4. Try to access admin route (should fail)
      const adminAttemptResponse = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(403);

      expect(adminAttemptResponse.body.success).toBe(false);
      expect(adminAttemptResponse.body.message).toContain('Admin access required');

      // 5. Change password
      const changePasswordResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 6. Login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'NewPassword123!'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);

      // 7. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('Cart to Order Workflow', () => {
    it('should handle cart to order conversion', async () => {
      // 1. Clear existing cart
      await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${userToken}`);

      // 2. Add multiple products to cart
      const cartItem1Response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 })
        .expect(201);

      expect(cartItem1Response.body.success).toBe(true);

      // 3. Update cart item quantity
      const cartItemId = cartItem1Response.body.data.id;
      const updateResponse = await request(app)
        .put(`/api/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(updateResponse.body.data.quantity).toBe(3);

      // 4. Validate cart before checkout
      const validateResponse = await request(app)
        .post('/api/cart/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(validateResponse.body.success).toBe(true);
      expect(validateResponse.body.data.valid).toBe(true);

      // 5. Get cart summary
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.success).toBe(true);
      expect(cartResponse.body.data.items.length).toBe(1);
      expect(cartResponse.body.data.summary.totalItems).toBe(3);

      // 6. Create address for order
      const billingAddressData = {
        type: 'BILLING',
        firstName: 'Integration',
        lastName: 'User',
        addressLine1: '456 Billing Street',
        city: 'Billing City',
        state: 'BC',
        postalCode: '54321',
        country: 'Test Country',
        phone: '+1234567890'
      };

      const billingAddressResponse = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(billingAddressData)
        .expect(201);

      const billingAddressId = billingAddressResponse.body.data.id;

      // 7. Create order from cart
      const orderData = {
        shippingAddressId: billingAddressId,
        billingAddressId: billingAddressId,
        paymentMethod: 'CARD',
        notes: 'Cart to order integration test'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.status).toBe('PENDING');

      // 8. Verify cart is cleared after order
      const emptyCartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(emptyCartResponse.body.data.items.length).toBe(0);

      // 9. Verify order contains correct items
      const newOrderId = orderResponse.body.data.id;
      const orderDetailsResponse = await request(app)
        .get(`/api/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderDetailsResponse.body.data.items.length).toBe(1);
      expect(orderDetailsResponse.body.data.items[0].quantity).toBe(3);
    });
  });

  describe('Product Management Workflow', () => {
    it('should handle complete product lifecycle', async () => {
      // 1. Create category
      const categoryData = {
        name: 'Integration Test Lifecycle Category',
        description: 'Category for product lifecycle test',
        isActive: true
      };

      const categoryResponse = await request(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      const lifecycleCategoryId = categoryResponse.body.data.id;

      // 2. Create product
      const productData = {
        name: 'Integration Test Lifecycle Product',
        description: 'Product for lifecycle test',
        price: 149.99,
        categoryId: lifecycleCategoryId,
        sku: 'LIFECYCLE-001',
        stock: 100,
        isActive: true,
        isFeatured: false
      };

      const productResponse = await request(app)
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      const lifecycleProductId = productResponse.body.data.id;

      // 3. Create variants
      const variantData = {
        productId: lifecycleProductId,
        name: 'Size',
        value: 'Large',
        price: 149.99,
        stock: 25,
        sku: 'LIFECYCLE-001-L',
        isActive: true
      };

      const variantResponse = await request(app)
        .post('/admin/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(variantData)
        .expect(201);

      expect(variantResponse.body.success).toBe(true);

      // 4. Update product to featured
      const updateProductResponse = await request(app)
        .put(`/admin/products/${lifecycleProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isFeatured: true })
        .expect(200);

      expect(updateProductResponse.body.data.isFeatured).toBe(true);

      // 5. Update stock
      const stockUpdateResponse = await request(app)
        .put(`/admin/products/${lifecycleProductId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 75, operation: 'set' })
        .expect(200);

      expect(stockUpdateResponse.body.data.stock).toBe(75);

      // 6. User views featured products
      const featuredResponse = await request(app)
        .get('/api/products/featured')
        .expect(200);

      expect(featuredResponse.body.success).toBe(true);
      const featuredProduct = featuredResponse.body.data.products.find(
        p => p.id === lifecycleProductId
      );
      expect(featuredProduct).toBeTruthy();

      // 7. User searches for product
      const searchResponse = await request(app)
        .get('/api/products?search=Lifecycle')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.products.length).toBeGreaterThan(0);

      // 8. Deactivate product
      const deactivateResponse = await request(app)
        .put(`/admin/products/${lifecycleProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(deactivateResponse.body.data.isActive).toBe(false);

      // 9. Verify product not visible to users
      const hiddenProductResponse = await request(app)
        .get(`/api/products/${lifecycleProductId}`)
        .expect(404);

      expect(hiddenProductResponse.body.success).toBe(false);

      // 10. Admin can still access inactive product
      const adminProductResponse = await request(app)
        .get(`/admin/products/${lifecycleProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminProductResponse.body.success).toBe(true);
      expect(adminProductResponse.body.data.isActive).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various error scenarios gracefully', async () => {
      // 1. Invalid authentication token
      const invalidTokenResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(invalidTokenResponse.body.success).toBe(false);

      // 2. Non-existent resource
      const notFoundResponse = await request(app)
        .get('/api/products/999999')
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);

      // 3. Validation errors
      const validationResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);

      expect(validationResponse.body.success).toBe(false);
      expect(validationResponse.body.message).toContain('validation');

      // 4. Insufficient permissions
      const permissionResponse = await request(app)
        .delete(`/admin/products/${testProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(permissionResponse.body.success).toBe(false);

      // 5. Business logic errors (e.g., insufficient stock)
      const stockResponse = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1000 })
        .expect(400);

      expect(stockResponse.body.success).toBe(false);
      expect(stockResponse.body.message).toContain('insufficient stock');
    });
  });
});
