const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All admin routes strictly require Admin role
router.use(authenticateToken);
router.use(requireRole('Admin'));

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/systems/:system_id/config', adminController.getSystemConfig);
router.put('/systems/:system_id/config', adminController.updateSystemConfig);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
