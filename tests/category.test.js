/**
 * Category Module Tests
 * Tests for category CRUD operations, both user and admin endpoints
 */

const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Category Module', () => {
  let authToken;
  let adminToken;
  let testCategoryId;
  let testSubcategoryId;

  beforeAll(async () => {
    // Clean up test data
    await prisma.category.deleteMany({
      where: { name: { contains: 'Test' } }
    });

    // Create test user
    const userData = {
      name: 'Category User',
      email: 'categoryuser@example.com',
      password: 'Password123!',
      phone: '+1234567890'
    };

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = userResponse.body.data.accessToken;

    // Create admin user
    const adminData = {
      name: 'Category Admin',
      email: 'categoryadmin@example.com',
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
    await prisma.category.deleteMany({
      where: { name: { contains: 'Test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'category' } }
    });
    await prisma.$disconnect();
  });

  // User routes tests
  describe('User Category Routes', () => {
    describe('GET /api/categories', () => {
      it('should get all categories for users', async () => {
        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('categories');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/categories?page=1&limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
      });

      it('should support search', async () => {
        const response = await request(app)
          .get('/api/categories?search=electronics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });

      it('should filter by parent category', async () => {
        const response = await request(app)
          .get('/api/categories?parentId=1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });

      it('should get only active categories by default', async () => {
        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.categories.forEach(category => {
          expect(category.isActive).toBe(true);
        });
      });
    });

    describe('GET /api/categories/:id', () => {
      it('should get category by ID', async () => {
        // First create a category via admin
        const categoryData = {
          name: 'Test Category',
          description: 'Test category description',
          isActive: true
        };

        const createResponse = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData);

        testCategoryId = createResponse.body.data.id;

        const response = await request(app)
          .get(`/api/categories/${testCategoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe('Test Category');
      });

      it('should fail with invalid category ID', async () => {
        const response = await request(app)
          .get('/api/categories/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should fail for non-existent category', async () => {
        const response = await request(app)
          .get('/api/categories/999999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Resource not found');
      });
    });

    describe('GET /api/categories/:id/subcategories', () => {
      it('should get subcategories of a category', async () => {
        const response = await request(app)
          .get(`/api/categories/${testCategoryId}/subcategories`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('subcategories');
        expect(Array.isArray(response.body.data.subcategories)).toBe(true);
      });

      it('should fail with invalid category ID', async () => {
        const response = await request(app)
          .get('/api/categories/invalid-id/subcategories')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Validation failed');
      });
    });
  });

  // Admin routes tests
  describe('Admin Category Routes', () => {
    describe('GET /admin/categories', () => {
      it('should get all categories for admin', async () => {
        const response = await request(app)
          .get('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('categories');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });

      it('should include inactive categories for admin', async () => {
        const response = await request(app)
          .get('/admin/categories?includeInactive=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get('/admin/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/admin/categories')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Unauthorized access');
      });
    });

    describe('POST /admin/categories', () => {
      it('should create new category', async () => {
        const categoryData = {
          name: 'Test New Category',
          description: 'Test new category description',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(categoryData.name);
        expect(response.body.data.description).toBe(categoryData.description);
      });

      it('should create subcategory with parent', async () => {
        const subcategoryData = {
          name: 'Test Subcategory',
          description: 'Test subcategory description',
          parentId: testCategoryId,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(subcategoryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(subcategoryData.name);
        expect(response.body.data.parentId).toBe(testCategoryId);

        testSubcategoryId = response.body.data.id;
      });

      it('should fail with duplicate name', async () => {
        const categoryData = {
          name: 'Test Category', // Duplicate name
          description: 'Another test category',
          isActive: true
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      it('should fail with invalid parent ID', async () => {
        const categoryData = {
          name: 'Test Invalid Parent',
          description: 'Test category with invalid parent',
          parentId: 999999,
          isActive: true
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Parent category not found');
      });

      it('should fail with missing required fields', async () => {
        const categoryData = {
          description: 'Missing name field'
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should fail for non-admin users', async () => {
        const categoryData = {
          name: 'Test Category',
          description: 'Test category description'
        };

        const response = await request(app)
          .post('/admin/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });
    });

    describe('GET /admin/categories/:id', () => {
      it('should get category by ID for admin', async () => {
        const response = await request(app)
          .get(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.id).toBe(testCategoryId);
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .get(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });
    });

    describe('PUT /admin/categories/:id', () => {
      it('should update category successfully', async () => {
        const updateData = {
          name: 'Updated Test Category',
          description: 'Updated description',
          isActive: false
        };

        const response = await request(app)
          .put(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Test Category');
        expect(response.body.data.description).toBe('Updated description');
        expect(response.body.data.isActive).toBe(false);
      });

      it('should fail with invalid data', async () => {
        const updateData = {
          name: '' // Empty name
        };

        const response = await request(app)
          .put(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should fail for non-existent category', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put('/admin/categories/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Resource not found');
      });

      it('should fail for non-admin users', async () => {
        const updateData = {
          name: 'Updated Name'
        };

        const response = await request(app)
          .put(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });
    });

    describe('DELETE /admin/categories/:id', () => {
      it('should fail to delete category with subcategories', async () => {
        const response = await request(app)
          .delete(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('subcategories');
      });

      it('should delete subcategory successfully', async () => {
        const response = await request(app)
          .delete(`/admin/categories/${testSubcategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should delete category after subcategories are removed', async () => {
        const response = await request(app)
          .delete(`/admin/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should fail for non-existent category', async () => {
        const response = await request(app)
          .delete('/admin/categories/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Resource not found');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .delete('/admin/categories/1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });
    });

    describe('POST /admin/categories/:id/image', () => {
      it('should fail without file upload', async () => {
        const response = await request(app)
          .post(`/admin/categories/1/image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('file');
      });

      it('should fail for non-admin users', async () => {
        const response = await request(app)
          .post('/admin/categories/1/image')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access forbidden');
      });
    });
  });
});
