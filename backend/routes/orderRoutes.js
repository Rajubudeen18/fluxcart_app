const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered, // Ensure this is exported from your controller
    getMyOrders,
    getAllOrders
} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All routes are protected by default
router.use(verifyToken);

router.route('/')
    .post(createOrder)
    .get(isAdmin, getAllOrders); // Admin only

router.route('/myorders').get(getMyOrders);

router.route('/:id').get(getOrderById);
router.route('/:id/pay').put(updateOrderToPaid);
router.route('/:id/deliver').put(isAdmin, updateOrderToDelivered); // Admin only

module.exports = router;