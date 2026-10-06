const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);
router.patch('/:id/stock', requireRole('ADMIN'), productsController.updateStock);

module.exports = router;
