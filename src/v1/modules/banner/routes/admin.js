const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners,
  bulkUpdateBanners,
  trackBannerClick,
  getBannerStats,
  getActiveBannersByPosition
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Banner management routes
router.get('/stats', getBannerStats);
router.get('/position/:position', getActiveBannersByPosition);
router.get('/', getAllBanners);
router.get('/:id', getBannerById);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/toggle-status', toggleBannerStatus);
router.patch('/:id/track-click', trackBannerClick);
router.patch('/reorder', reorderBanners);
router.patch('/bulk-update', bulkUpdateBanners);

module.exports = router;
