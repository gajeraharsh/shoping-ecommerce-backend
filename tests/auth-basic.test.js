/**
 * Basic Auth Module Tests
 * Simplified tests to check core auth functionality
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Basic Auth Module', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'basictest' } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'basictest' } }
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Basic Test User',
        email: 'basictest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      console.log('Register Response:', response.status, response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'basictest@example.com', // Same email as above
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      console.log('Duplicate Email Response:', response.status, response.body);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const userData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      console.log('Invalid Data Response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'basictest@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      console.log('Login Response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should fail with invalid credentials', async () => {
      const loginData = {
        email: 'basictest@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      console.log('Invalid Login Response:', response.status, response.body);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing credentials', async () => {
      const loginData = {
        email: 'basictest@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      console.log('Missing Credentials Response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'basictest@example.com' });

      console.log('Forgot Password Response:', response.status, response.body);

      // Should succeed even if email service is not configured
      expect([200, 500]).toContain(response.status);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' });

      console.log('Invalid Email Format Response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        });

      console.log('Invalid Reset Token Response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      console.log('Health Check Response:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
