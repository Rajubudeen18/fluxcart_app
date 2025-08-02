// File: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, loginAdmin, loginCustomer, refreshToken } = require('../controllers/authController');

// Admin Login Route
router.post('/admin-login', loginAdmin);

// Customer Login Route
router.post('/customer-login', loginCustomer);

// Customer Registration Route
router.post('/register', register);

// Refresh Token Route
router.post('/refresh-token', refreshToken);

module.exports = router;
