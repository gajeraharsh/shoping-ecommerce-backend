/**
 * User Module Tests
 * Tests for user profile management, CRUD operations
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('User Module', () => {
  let testUser;
  let authToken;
  let adminToken;
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'usertest' } }
    });

    // Create test user
    const userData = {
      firstName: 'User',
      lastName: 'Test',
      email: 'usertest@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = registerResponse.body.data.user;
    authToken = registerResponse.body.data.token;
    testUserId = testUser.id;

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'Test',
      email: 'adminusertest@example.com',
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
    await prisma.user.deleteMany({
      where: { email: { contains: 'usertest' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('firstName');
      expect(response.body.data).toHaveProperty('lastName');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.email).toBe('usertest@example.com');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        phone: '+1987654321'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('User');
      expect(response.body.data.phone).toBe('+1987654321');
    });

    it('should fail with invalid phone format', async () => {
      const updateData = {
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('DELETE /api/profile', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('POST /api/profile/avatar', () => {
    it('should fail without file upload', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('file');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  // Admin routes tests
  describe('Admin User Management', () => {
    describe('GET /admin/users', () => {
      it('should get all users for admin', async () => {
        const response = await request(app)
          .get('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('users');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.users)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/admin/users?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
        expect(response.body.data.pagination).toHaveProperty('total');
      });

      it('should support search', async () => {
        const response = await request(app)
          .get('/admin/users?search=usertest')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users.length).toBeGreaterThan(0);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/users')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access token required');
      });
    });

    describe('GET /admin/users/:id', () => {
      it('should get specific user for admin', async () => {
        const response = await request(app)
          .get(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testUserId);
      });

      it('should fail with invalid user ID', async () => {
        const response = await request(app)
          .get('/admin/users/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-existent user', async () => {
        const response = await request(app)
          .get('/admin/users/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('User not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('PUT /admin/users/:id', () => {
      it('should update user for admin', async () => {
        const updateData = {
          firstName: 'Admin Updated',
          role: 'USER'
        };

        const response = await request(app)
          .put(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Admin Updated');
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          email: 'invalid-email'
        };

        const response = await request(app)
          .put(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          firstName: 'Updated'
        };

        const response = await request(app)
          .put(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });

    describe('DELETE /admin/users/:id', () => {
      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete(`/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });

      it('should fail with invalid user ID', async () => {
        const response = await request(app)
          .delete('/admin/users/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });
    });

    describe('POST /admin/users', () => {
      it('should create new user for admin', async () => {
        const userData = {
          firstName: 'Admin',
          lastName: 'Created',
          email: 'admincreated@example.com',
          password: 'Password123!',
          phone: '+1234567892',
          role: 'USER'
        };

        const response = await request(app)
          .post('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.email).toBe(userData.email);
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          firstName: 'Admin',
          lastName: 'Created',
          email: 'usertest@example.com', // Duplicate
          password: 'Password123!',
          phone: '+1234567893'
        };

        const response = await request(app)
          .post('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail for non-admin users', async () => {
        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          phone: '+1234567894'
        };

        const response = await request(app)
          .post('/admin/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send(userData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Admin access required');
      });
    });
  });
});
