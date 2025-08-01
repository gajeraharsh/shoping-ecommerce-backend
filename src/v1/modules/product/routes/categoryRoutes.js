const express = require('express');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticate, adminOnly, createCategory);

module.exports = router;