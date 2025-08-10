/**
 * Instagram Service
 * Contains business logic for Instagram reel operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');
const { uploadToS3 } = require('../../utils/upload');

/**
 * Create a new Instagram reel
 * @param {Object} reelData - Reel data
 * @param {Object} files - Uploaded files (video and thumbnail)
 * @returns {Object} Created reel
 */
const createReel = async (reelData, files) => {
  // Handle video and thumbnail uploads
  let videoUrl = null;
  let thumbnailUrl = null;

  if (files) {
    if (files.video && files.video[0]) {
      const videoFile = files.video[0];
      videoUrl = await uploadToS3(videoFile.buffer, `reels/videos/${Date.now()}-${videoFile.originalname}`, videoFile.mimetype);
    }

    if (files.thumbnail && files.thumbnail[0]) {
      const thumbnailFile = files.thumbnail[0];
      thumbnailUrl = await uploadToS3(thumbnailFile.buffer, `reels/thumbnails/${Date.now()}-${thumbnailFile.originalname}`, thumbnailFile.mimetype);
    }
  }

  if (!videoUrl) {
    throw new Error('Video file is required');
  }

  return await prisma.instagramReel.create({
    data: {
      ...reelData,
      videoUrl,
      thumbnail: thumbnailUrl,
      tags: reelData.tags ? JSON.parse(reelData.tags) : null,
      isActive: reelData.isActive !== undefined ? Boolean(reelData.isActive) : true
    }
  });
};

/**
 * Get Instagram reels with pagination and filtering
 * @param {Object} query - Query parameters
 * @returns {Object} Reels with metadata
 */
const getReels = async (query) => {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    isActive,
    search
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { ...notDeletedWhere() };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [sortField, sortOrder] = sort.split(':');
  const orderBy = { [sortField]: sortOrder || 'desc' };

  const [reels, total] = await Promise.all([
    prisma.instagramReel.findMany({
      where,
      orderBy,
      skip: offset,
      take: limitNum
    }),
    prisma.instagramReel.count({ where })
  ]);

  return {
    data: reels,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get Instagram reel by ID
 * @param {string} id - Reel ID
 * @returns {Object|null} Reel or null
 */
const getReelById = async (id) => {
  return await prisma.instagramReel.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });
};

/**
 * Update Instagram reel by ID
 * @param {string} id - Reel ID
 * @param {Object} updateData - Update data
 * @param {Object} files - New uploaded files
 * @returns {Object} Updated reel
 */
const updateReel = async (id, updateData, files) => {
  // Verify reel exists
  const existingReel = await prisma.instagramReel.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!existingReel) {
    throw new Error('Instagram reel not found');
  }

  // Handle new file uploads
  let videoUrl = existingReel.videoUrl;
  let thumbnailUrl = existingReel.thumbnail;

  if (files) {
    if (files.video && files.video[0]) {
      const videoFile = files.video[0];
      videoUrl = await uploadToS3(videoFile.buffer, `reels/videos/${Date.now()}-${videoFile.originalname}`, videoFile.mimetype);
    }

    if (files.thumbnail && files.thumbnail[0]) {
      const thumbnailFile = files.thumbnail[0];
      thumbnailUrl = await uploadToS3(thumbnailFile.buffer, `reels/thumbnails/${Date.now()}-${thumbnailFile.originalname}`, thumbnailFile.mimetype);
    }
  }

  const updatePayload = { ...updateData };
  if (files && files.video) updatePayload.videoUrl = videoUrl;
  if (files && files.thumbnail) updatePayload.thumbnail = thumbnailUrl;
  if (updateData.tags) updatePayload.tags = JSON.parse(updateData.tags);
  if (updateData.isActive !== undefined) updatePayload.isActive = Boolean(updateData.isActive);

  return await prisma.instagramReel.update({
    where: { id: Number(id) },
    data: updatePayload
  });
};

/**
 * Soft delete Instagram reel by ID
 * @param {string} id - Reel ID
 */
const deleteReel = async (id) => {
  const reel = await prisma.instagramReel.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!reel) {
    throw new Error('Instagram reel not found');
  }

  await markDeleted('instagramReel', id, prisma);
};

module.exports = {
  createReel,
  getReels,
  getReelById,
  updateReel,
  deleteReel
};
