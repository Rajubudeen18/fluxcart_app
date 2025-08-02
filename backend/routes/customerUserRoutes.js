const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const {
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPassword,
    getCustomerOrders
} = require('../controllers/customerController');

router.get('/profile', verifyToken, getCustomerProfile);

router.put('/profile', verifyToken, updateCustomerProfile);

router.put('/change-password', verifyToken, changeCustomerPassword);

router.get('/orders', verifyToken, getCustomerOrders);

module.exports = router;
