const express = require('express');
const { auth } = require('../../../middlewares/auth');
const {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('./controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/', getAddresses);
router.get('/:id', getAddress);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router; 