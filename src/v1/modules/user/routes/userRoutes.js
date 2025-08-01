const express = require('express');
const {
  updateProfile,
  getAddresses,
  addAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/userController');
const { authenticate } = require('../../../../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.put('/profile', updateProfile);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;