const express = require('express');
const { auth } = require('../../../middlewares/auth');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  moveToCart
} = require('./controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/', clearWishlist);
router.post('/:productId/move-to-cart', moveToCart);

module.exports = router; 