/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Load environment variables from .env file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://postgres:1@localhost:5432/ecommerce_db?schema=public';

// Check if DATABASE_URL is loaded from .env
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL not found in environment variables.');
  console.warn('Please make sure your .env file contains DATABASE_URL.');
  console.warn('Example: DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"');
  process.exit(1);
}

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
