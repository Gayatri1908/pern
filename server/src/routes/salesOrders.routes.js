const express = require('express');
const router = express.Router();
const salesOrdersController = require('../controllers/salesOrdersController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', salesOrdersController.listSalesOrders);
router.get('/:id', salesOrdersController.getSalesOrder);

// Only ADMIN can confirm order (reserve stock) and process dispatch
router.post('/:id/confirm', requireRole('ADMIN'), salesOrdersController.confirmSalesOrder);
router.post('/:id/dispatch', requireRole('ADMIN'), salesOrdersController.dispatchSalesOrder);

module.exports = router;
