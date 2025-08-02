const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Apply middleware to all routes in this file
router.use(verifyToken, isAdmin);

router.route('/')
    .get(customerController.getAllCustomers);

router.route('/:id')
    .get(customerController.getCustomerById)
    .patch(customerController.updateCustomer) // Use PATCH for all updates, including status
    .delete(customerController.deleteCustomer);

// Other admin-related customer actions
router.patch('/:id/reset-password', customerController.resetCustomerPassword);
router.post('/impersonate/:id', customerController.impersonateCustomer);

module.exports = router;