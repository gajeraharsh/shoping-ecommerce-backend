const express = require('express');
const {
  getBrands,
  getBrandBySlug,
  getProductsByBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:slug', getBrandBySlug);
router.get('/:slug/products', getProductsByBrand);

// Admin routes
router.post('/', authenticate, adminOnly, createBrand);
router.put('/:id', authenticate, adminOnly, updateBrand);
router.delete('/:id', authenticate, adminOnly, deleteBrand);

module.exports = router; 