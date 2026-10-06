const express = require('express');
const router = express.Router();
const componentsController = require('../controllers/componentsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', componentsController.getComponents);
router.get('/:id', componentsController.getComponentById);
router.patch('/:id', authenticateToken, requireRole(['Admin', 'Operator']), componentsController.updateComponent);

module.exports = router;
