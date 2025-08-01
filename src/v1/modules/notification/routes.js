const express = require('express');
const { auth } = require('../../../middlewares/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  getUnreadCount,
  createNotification,
  createBulkNotifications
} = require('./controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Basic notification routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearNotifications);

// Admin routes (for creating notifications)
router.post('/', createNotification);
router.post('/bulk', createBulkNotifications);

module.exports = router; 