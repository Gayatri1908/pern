const express = require('express');
const router = express.Router();
const quotationsController = require('../controllers/quotationsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', quotationsController.listQuotations);
router.get('/:id', quotationsController.getQuotation);
router.post('/', quotationsController.createQuotation);
router.patch('/:id/send', quotationsController.sendQuotation);
router.patch('/:id/decision', quotationsController.decideQuotation);
router.post('/:id/convert-to-order', quotationsController.convertToSalesOrder);

module.exports = router;
