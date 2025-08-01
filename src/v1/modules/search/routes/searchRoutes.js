const express = require('express');
const {
  searchProducts,
  searchAutocomplete,
  getSearchSuggestions,
  getPopularSearches,
  getTrendingSearches
} = require('../controllers/searchController');

const router = express.Router();

// Public routes
router.get('/products', searchProducts);
router.get('/autocomplete', searchAutocomplete);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.get('/trending', getTrendingSearches);

module.exports = router; 