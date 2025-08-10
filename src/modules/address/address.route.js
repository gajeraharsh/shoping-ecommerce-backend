/**
 * Address Routes
 * Defines API endpoints for address operations
 */

const express = require('express');
const router = express.Router();
const addressController = require('./address.controller');
const { authenticate, requireSelfOrAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const addressValidation = require('./address.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Address ID
 *         userId:
 *           type: integer
 *           description: User ID
 *         name:
 *           type: string
 *           description: Recipient name
 *         phone:
 *           type: string
 *           description: Phone number
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State
 *         country:
 *           type: string
 *           description: Country
 *         zipCode:
 *           type: string
 *           description: ZIP code
 *         isDefault:
 *           type: boolean
 *           description: Is default address
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get user's addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, addressController.getUserAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.get('/:id', 
  authenticate, 
  validate(addressValidation.getAddressByIdSchema, 'params'),
  addressController.getAddressById
);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - address
 *               - city
 *               - state
 *               - country
 *               - zipCode
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticate, 
  validate(addressValidation.createAddressSchema, 'body'),
  addressController.createAddress
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.put('/:id', 
  authenticate, 
  validate(addressValidation.updateAddressSchema, 'body'),
  validate(addressValidation.getAddressByIdSchema, 'params'),
  addressController.updateAddress
);

/**
 * @swagger
 * /api/addresses/{id}/default:
 *   put:
 *     summary: Set address as default
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Default address set successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.put('/:id/default', 
  authenticate, 
  validate(addressValidation.getAddressByIdSchema, 'params'),
  addressController.setDefaultAddress
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.delete('/:id', 
  authenticate, 
  validate(addressValidation.getAddressByIdSchema, 'params'),
  addressController.deleteAddress
);

module.exports = router;
