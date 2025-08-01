const express = require('express');
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

router.get('/', getBanners);
router.post('/', authenticate, adminOnly, createBanner);
router.put('/:id', authenticate, adminOnly, updateBanner);
router.delete('/:id', authenticate, adminOnly, deleteBanner);

module.exports = router;