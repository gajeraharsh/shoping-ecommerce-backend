/**
 * Feed Service
 * Contains business logic for feed section operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');
const { uploadToS3 } = require('../../utils/upload');

/**
 * Create a new feed section
 * @param {Object} feedData - Feed section data
 * @param {Object} file - Banner image file
 * @returns {Object} Created feed section
 */
const createFeedSection = async (feedData, file) => {
  // Handle banner image upload
  let bannerImageUrl = null;
  if (file) {
    bannerImageUrl = await uploadToS3(file.buffer, `feed/${Date.now()}-${file.originalname}`, file.mimetype);
  }

  return await prisma.feedSection.create({
    data: {
      ...feedData,
      bannerImage: bannerImageUrl,
      order: parseInt(feedData.order) || 0,
      isActive: feedData.isActive !== undefined ? Boolean(feedData.isActive) : true
    }
  });
};

/**
 * Get feed sections with pagination and filtering
 * @param {Object} query - Query parameters
 * @returns {Object} Feed sections with metadata
 */
const getFeedSections = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'order:asc',
    isActive
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { ...notDeletedWhere() };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'asc' };

  const [feedSections, total] = await Promise.all([
    prisma.feedSection.findMany({
      where,
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.feedSection.count({ where })
  ]);

  return {
    data: feedSections,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get feed section by ID
 * @param {string} id - Feed section ID
 * @returns {Object|null} Feed section or null
 */
const getFeedSectionById = async (id) => {
  return await prisma.feedSection.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });
};

/**
 * Update feed section by ID
 * @param {string} id - Feed section ID
 * @param {Object} updateData - Update data
 * @param {Object} file - New banner image file
 * @returns {Object} Updated feed section
 */
const updateFeedSection = async (id, updateData, file) => {
  // Verify feed section exists
  const existingFeedSection = await prisma.feedSection.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!existingFeedSection) {
    throw new Error('Feed section not found');
  }

  // Handle banner image upload
  let bannerImageUrl = existingFeedSection.bannerImage;
  if (file) {
    bannerImageUrl = await uploadToS3(file.buffer, `feed/${Date.now()}-${file.originalname}`, file.mimetype);
  }

  const updatePayload = { ...updateData };
  if (file) updatePayload.bannerImage = bannerImageUrl;
  if (updateData.order !== undefined) updatePayload.order = parseInt(updateData.order);
  if (updateData.isActive !== undefined) updatePayload.isActive = Boolean(updateData.isActive);

  return await prisma.feedSection.update({
    where: { id: Number(id) },
    data: updatePayload
  });
};

/**
 * Soft delete feed section by ID
 * @param {string} id - Feed section ID
 */
const deleteFeedSection = async (id) => {
  const feedSection = await prisma.feedSection.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!feedSection) {
    throw new Error('Feed section not found');
  }

  await markDeleted('feedSection', id, prisma);
};

module.exports = {
  createFeedSection,
  getFeedSections,
  getFeedSectionById,
  updateFeedSection,
  deleteFeedSection
};
