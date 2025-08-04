const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllSEOPages,
  getSEOPageById,
  getSEOPageByName,
  createSEOPage,
  updateSEOPage,
  deleteSEOPage,
  generateSEORecommendations,
  getSEOStats
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// SEO management routes
router.get('/stats', getSEOStats);
router.get('/page/:pageName', getSEOPageByName);
router.get('/:id/recommendations', generateSEORecommendations);
router.get('/', getAllSEOPages);
router.get('/:id', getSEOPageById);
router.post('/', createSEOPage);
router.put('/:id', updateSEOPage);
router.delete('/:id', deleteSEOPage);

module.exports = router;
