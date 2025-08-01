const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats,
  getUserActivity,
  getUserPreferences,
  deleteAccount
} = require('../controllers/userController');
const { authenticate } = require('../../../../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Dashboard and stats
router.get('/dashboard/stats', getDashboardStats);
router.get('/activity', getUserActivity);
router.get('/preferences', getUserPreferences);

// Account management
router.delete('/account', deleteAccount);

module.exports = router;