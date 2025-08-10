/**
 * AWS S3 Configuration
 * Configures S3 client with credentials from environment variables
 */

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

module.exports = {
  s3,
  bucketName: process.env.S3_BUCKET
};
