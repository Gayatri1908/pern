const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', maintenanceController.getMaintenanceRecords);
router.post('/', authenticateToken, requireRole(['Admin', 'Operator']), maintenanceController.createMaintenanceRecord);
router.patch('/:id', authenticateToken, requireRole(['Admin', 'Operator']), maintenanceController.updateMaintenanceRecord);

module.exports = router;
