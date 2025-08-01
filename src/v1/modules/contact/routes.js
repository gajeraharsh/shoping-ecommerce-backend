const express = require('express');
const { auth } = require('../../../middlewares/auth');
const { admin } = require('../../../middlewares/admin');
const {
  submitContact,
  getContacts,
  getContact,
  markAsRead,
  markAllAsRead,
  deleteContact,
  getContactStats
} = require('./controller');

const router = express.Router();

// Public route
router.post('/submit', submitContact);

// Admin routes
router.get('/', auth, admin, getContacts);
router.get('/stats', auth, admin, getContactStats);
router.get('/:id', auth, admin, getContact);
router.patch('/:id/read', auth, admin, markAsRead);
router.patch('/mark-all-read', auth, admin, markAllAsRead);
router.delete('/:id', auth, admin, deleteContact);

module.exports = router; 