const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllSubscribers,
  getSubscriberById,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  toggleSubscriberStatus,
  bulkUpdateSubscribers,
  getNewsletterStats,
  exportSubscribers
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Newsletter management routes
router.get('/stats', getNewsletterStats);
router.get('/export', exportSubscribers);
router.get('/', getAllSubscribers);
router.get('/:id', getSubscriberById);
router.post('/', createSubscriber);
router.put('/:id', updateSubscriber);
router.delete('/:id', deleteSubscriber);
router.patch('/:id/toggle-status', toggleSubscriberStatus);
router.patch('/bulk-update', bulkUpdateSubscribers);

module.exports = router;
