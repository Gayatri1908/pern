const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/energy', analyticsController.getEnergyAnalytics);

module.exports = router;
