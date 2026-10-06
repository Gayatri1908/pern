const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', telemetryController.getAllTelemetry);
router.post('/', authenticateToken, telemetryController.recordTelemetry);

module.exports = router;
