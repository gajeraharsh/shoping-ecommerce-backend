/**
 * AWS S3 Upload Utility
 * Handles file uploads to S3 with Multer integration
 */

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { s3, bucketName } = require('../config/aws');
const { logger } = require('./logger');

/**
 * Upload file buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 object key
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} S3 URL
 */
const uploadToS3 = async (buffer, key, mimetype) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    logger.info(`File uploaded to S3: ${result.Location}`);
    return result.Location;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Generate unique file key for S3
 * @param {string} originalName - Original filename
 * @param {string} folder - S3 folder path
 * @returns {string} Unique S3 key
 */
const generateFileKey = (originalName, folder = 'uploads') => {
  const extension = originalName.split('.').pop();
  const uniqueName = `${uuidv4()}.${extension}`;
  return `${folder}/${uniqueName}`;
};

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer upload configurations
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Middleware to upload single image to S3
 * @param {string} fieldName - Form field name
 * @param {string} folder - S3 folder path
 */
const uploadSingle = (fieldName, folder = 'uploads') => {
  return async (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (req.file) {
        try {
          const key = generateFileKey(req.file.originalname, folder);
          const url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
          req.uploadedFile = { url, key };
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload file'
          });
        }
      }

      next();
    });
  };
};

/**
 * Middleware to upload multiple images to S3
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @param {string} folder - S3 folder path
 */
const uploadMultiple = (fieldName, maxCount = 10, folder = 'uploads') => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (req.files && req.files.length > 0) {
        try {
          const uploadPromises = req.files.map(async (file) => {
            const key = generateFileKey(file.originalname, folder);
            const url = await uploadToS3(file.buffer, key, file.mimetype);
            return { url, key };
          });

          req.uploadedFiles = await Promise.all(uploadPromises);
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload files'
          });
        }
      }

      next();
    });
  };
};

module.exports = {
  uploadToS3,
  generateFileKey,
  uploadSingle,
  uploadMultiple,
  upload
};
