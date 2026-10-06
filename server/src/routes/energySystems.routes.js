const express = require('express');
const router = express.Router();
const energySystemsController = require('../controllers/energySystemsController');
const telemetryController = require('../controllers/telemetryController');
const healthController = require('../controllers/healthController');
const alertsController = require('../controllers/alertsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public or authenticated reading
router.get('/', energySystemsController.getEnergySystems);
router.get('/:id', energySystemsController.getEnergySystemById);
router.get('/:id/telemetry', telemetryController.getSystemTelemetry);
router.get('/:id/health', healthController.getSystemHealth);
router.get('/:id/alerts', alertsController.getAlerts);

// Protected system updates (Operator or Admin)
router.patch('/:id', authenticateToken, requireRole(['Admin', 'Operator']), energySystemsController.updateEnergySystem);

module.exports = router;
