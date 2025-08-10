/**
 * Address Controller
 * Handles HTTP requests for address operations
 */

const addressService = require('./address.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAddress = async (req, res) => {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);
    success(res, address, 'Address created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get user's addresses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserAddresses = async (req, res) => {
  try {
    const addresses = await addressService.getUserAddresses(req.user.id);
    success(res, addresses, 'Addresses retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get address by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAddressById = async (req, res) => {
  try {
    const address = await addressService.getAddressById(req.params.id, req.user.id, req.user.role);
    if (!address) {
      return error(res, 'Address not found', 404);
    }
    success(res, address, 'Address retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update address by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAddress = async (req, res) => {
  try {
    const address = await addressService.updateAddress(req.params.id, req.user.id, req.body, req.user.role);
    success(res, address, 'Address updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Set default address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const setDefaultAddress = async (req, res) => {
  try {
    const address = await addressService.setDefaultAddress(req.params.id, req.user.id);
    success(res, address, 'Default address set successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete address by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAddress = async (req, res) => {
  try {
    await addressService.deleteAddress(req.params.id, req.user.id, req.user.role);
    success(res, null, 'Address deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
