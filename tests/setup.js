/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock AWS S3 for tests
jest.mock('../src/config/aws', () => ({
  s3: {
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg'
      })
    })
  },
  bucketName: 'test-bucket'
}));

// Mock logger for tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  auditLog: jest.fn()
}));

// Global test timeout
jest.setTimeout(30000);
