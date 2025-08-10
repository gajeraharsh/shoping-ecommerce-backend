/**
 * Address Module Tests
 * Tests for user address management - CRUD operations
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Address Module', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let testAddressId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.address.deleteMany({
      where: { user: { email: { contains: 'addresstest' } } }
    });

    // Create test user
    const userData = {
      firstName: 'Address',
      lastName: 'User',
      email: 'addresstest@example.com',
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
      firstName: 'Address',
      lastName: 'Admin',
      email: 'addressadmin@example.com',
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
    await prisma.address.deleteMany({
      where: { user: { email: { contains: 'addresstest' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'addresstest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/addresses', () => {
    it('should get empty addresses list initially', async () => {
      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('addresses');
      expect(Array.isArray(response.body.data.addresses)).toBe(true);
      expect(response.body.data.addresses.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/addresses')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/addresses', () => {
    it('should create shipping address', async () => {
      const addressData = {
        type: 'SHIPPING',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        phone: '+1234567890',
        isDefault: true
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe('SHIPPING');
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
      expect(response.body.data.isDefault).toBe(true);

      testAddressId = response.body.data.id;
    });

    it('should create billing address', async () => {
      const addressData = {
        type: 'BILLING',
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'United States',
        phone: '+1987654321',
        isDefault: false
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('BILLING');
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.isDefault).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const addressData = {
        type: 'SHIPPING',
        firstName: 'John'
        // Missing lastName, addressLine1, city, state, postalCode, country
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with invalid address type', async () => {
      const addressData = {
        type: 'INVALID_TYPE',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail with invalid postal code format', async () => {
      const addressData = {
        type: 'SHIPPING',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: 'INVALID',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const addressData = {
        type: 'SHIPPING',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses')
        .send(addressData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('GET /api/addresses (with data)', () => {
    it('should get user addresses', async () => {
      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses.length).toBeGreaterThan(0);
    });

    it('should filter by address type', async () => {
      const response = await request(app)
        .get('/api/addresses?type=SHIPPING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.addresses.forEach(address => {
        expect(address.type).toBe('SHIPPING');
      });
    });

    it('should get only default addresses', async () => {
      const response = await request(app)
        .get('/api/addresses?default=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.addresses.forEach(address => {
        expect(address.isDefault).toBe(true);
      });
    });
  });

  describe('GET /api/addresses/:id', () => {
    it('should get address by ID', async () => {
      const response = await request(app)
        .get(`/api/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(testAddressId);
    });

    it('should fail with invalid address ID', async () => {
      const response = await request(app)
        .get('/api/addresses/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail for non-existent address', async () => {
      const response = await request(app)
        .get('/api/addresses/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/addresses/${testAddressId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/addresses/:id', () => {
    it('should update address successfully', async () => {
      const updateData = {
        firstName: 'Johnny',
        lastName: 'Doe',
        addressLine2: 'Suite 5C',
        city: 'Brooklyn',
        phone: '+1555123456'
      };

      const response = await request(app)
        .put(`/api/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Johnny');
      expect(response.body.data.lastName).toBe('Doe');
      expect(response.body.data.addressLine2).toBe('Suite 5C');
      expect(response.body.data.city).toBe('Brooklyn');
      expect(response.body.data.phone).toBe('+1555123456');
    });

    it('should fail with invalid data', async () => {
      const updateData = {
        postalCode: 'INVALID_FORMAT'
      };

      const response = await request(app)
        .put(`/api/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail for non-existent address', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/addresses/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/addresses/${testAddressId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/addresses/:id/default', () => {
    it('should set address as default', async () => {
      const response = await request(app)
        .put(`/api/addresses/${testAddressId}/default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isDefault).toBe(true);
    });

    it('should fail for non-existent address', async () => {
      const response = await request(app)
        .put('/api/addresses/999999/default')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/addresses/${testAddressId}/default`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    it('should delete address successfully', async () => {
      // Create an address to delete
      const addressData = {
        type: 'BILLING',
        firstName: 'Delete',
        lastName: 'Test',
        addressLine1: '789 Delete Street',
        city: 'Delete City',
        state: 'DC',
        postalCode: '12345',
        country: 'United States',
        isDefault: false
      };

      const createResponse = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData);

      const addressToDelete = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/addresses/${addressToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should fail to delete default address if it\'s the only one', async () => {
      // This test assumes testAddressId is the only address and is default
      const response = await request(app)
        .delete(`/api/addresses/${testAddressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete the only default address');
    });

    it('should fail for non-existent address', async () => {
      const response = await request(app)
        .delete('/api/addresses/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/addresses/${testAddressId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/addresses/validate', () => {
    it('should validate address format', async () => {
      const addressData = {
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data.valid).toBe(true);
    });

    it('should fail with invalid address format', async () => {
      const addressData = {
        addressLine1: '',
        city: 'New York',
        state: 'INVALID_STATE',
        postalCode: 'INVALID',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data.valid).toBe(false);
    });

    it('should fail without authentication', async () => {
      const addressData = {
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      };

      const response = await request(app)
        .post('/api/addresses/validate')
        .send(addressData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  // Admin routes tests
  describe('Admin Address Routes', () => {
    describe('GET /admin/addresses', () => {
      it('should get all addresses for admin', async () => {
        const response = await request(app)
          .get('/admin/addresses')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('addresses');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.addresses)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/admin/addresses?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should filter by user ID', async () => {
        const response = await request(app)
          .get(`/admin/addresses?userId=${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.addresses)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/addresses')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/addresses')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('GET /admin/addresses/:id', () => {
      it('should get address by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/addresses/${testAddressId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testAddressId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/addresses/${testAddressId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/addresses/:id', () => {
      it('should update address for admin', async () => {
        const updateData = {
          firstName: 'Admin Updated',
          notes: 'Updated by admin'
        };

        const response = await request(app)
          .put(`/admin/addresses/${testAddressId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Admin Updated');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          firstName: 'Updated'
        };

        const response = await request(app)
          .put(`/admin/addresses/${testAddressId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/addresses/:id', () => {
      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/addresses/${testAddressId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail with invalid address ID', async () => {
        const response = await request(app)
          .delete('/admin/addresses/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });
    });
  });
});
