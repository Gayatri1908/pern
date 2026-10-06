const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', customersController.listCustomers);
router.post('/', customersController.createCustomer);

module.exports = router;
