const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getInventoryOverview,
  updateVariantInventory,
  getInventoryStats
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Inventory management routes
router.get('/stats', getInventoryStats);
router.get('/', getInventoryOverview);
router.patch('/variant/:variantId', updateVariantInventory);

module.exports = router;
