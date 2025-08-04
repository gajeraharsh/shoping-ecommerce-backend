const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const upload = require('../../../../middlewares/upload');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  createProductVariant,
  getProductStats,
  bulkUpdateProducts
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Product management routes
router.get('/stats', getProductStats);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/images', upload.array('images', 10), addProductImages);
router.post('/:id/variants', createProductVariant);
router.patch('/bulk-update', bulkUpdateProducts);

module.exports = router;
