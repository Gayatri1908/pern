const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', enquiriesController.listEnquiries);
router.get('/:id', enquiriesController.getEnquiry);
router.post('/', enquiriesController.createEnquiry);

module.exports = router;
