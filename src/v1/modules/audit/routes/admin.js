const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllAuditLogs,
  getAuditLogById,
  createAuditLog,
  deleteAuditLog,
  bulkDeleteAuditLogs,
  getAuditStats,
  exportAuditLogs,
  getResourceTimeline
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Audit log management routes
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);
router.get('/resource/:resource/:resourceId', getResourceTimeline);
router.get('/', getAllAuditLogs);
router.get('/:id', getAuditLogById);
router.post('/', createAuditLog);
router.delete('/:id', deleteAuditLog);
router.delete('/bulk/cleanup', bulkDeleteAuditLogs);

module.exports = router;
