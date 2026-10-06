const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', alertsController.getAlerts);
router.post('/', authenticateToken, alertsController.createAlert);
router.patch('/:id/acknowledge', authenticateToken, requireRole(['Admin', 'Operator']), alertsController.acknowledgeAlert);
router.patch('/:id/resolve', authenticateToken, requireRole(['Admin', 'Operator']), alertsController.resolveAlert);

module.exports = router;
