const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');

router.get('/overview', monitoringController.getMissionControlOverview);
router.get('/live', monitoringController.getLiveMonitoringFeed);

module.exports = router;
